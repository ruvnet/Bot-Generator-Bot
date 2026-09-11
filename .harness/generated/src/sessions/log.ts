// SPDX-License-Identifier: MIT
//
// Recoverable session log — copy-in scaffold from ADR-246 §2.3
// (metaharness docs/adrs/ADR-246-prime-agent-continual-harness-refine.md).
// Self-contained: node builtins only, no @metaharness/kernel dependency.
//
// Append-only JSONL: one event per line, per-branch 0-based monotonic
// indexes; a forked branch's first event carries parent {branch, index}.
// Wire key order is EXACTLY index, branch, parent, kind, payload (parent
// omitted when absent).
//
// State-hash fold (mirrors @metaharness/kernel SessionLog exactly):
//   hexPrev = ''; for each lineage event (root -> tip):
//     hexPrev = lowercaseHex(sha256(utf8(hexPrev + canonicalJson(event))))
// where canonicalJson is recursively key-sorted (UTF-8 byte order),
// whitespace-free JSON.
//
// Session state lives wherever you point the constructor (suggested:
// .harness/sessions/<id>.jsonl). Prune old logs by deleting files.

import { appendFile, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

export interface SessionEvent {
  index: number;
  branch: string;
  parent?: { branch: string; index: number };
  kind: string;
  payload: unknown;
}

// Keys sort by UTF-8 BYTE order (not UTF-16 code-unit order, which default
// .sort() uses) to match the Rust mirror's byte-wise &str ordering.
function canonicalJson(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v) ?? 'null';
  if (Array.isArray(v)) return '[' + v.map(canonicalJson).join(',') + ']';
  const rec = v as Record<string, unknown>;
  const keys = Object.keys(rec).filter(k => rec[k] !== undefined)
    .sort((a, b) => Buffer.compare(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8')));
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalJson(rec[k])).join(',') + '}';
}

// A raw unpaired surrogate — not valid UTF-8; a Rust mirror (serde_json)
// cannot parse it, so both append and read reject it.
const LONE_SURROGATE =
  /(?:[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF])/;
// Well-formed JSON.stringify renders a lone surrogate as a \udXXX escape
// (paired surrogates pass through raw), preceded by an even backslash run.
const LONE_SURROGATE_ESCAPE = /(?<=(?:^|[^\\])(?:\\\\)*)\\u[dD][89abAB]/;

// Read-path check on DECODED data (string values AND object keys): a valid
// \udXXX pair decodes to an astral character, a lone surrogate stays lone.
function containsLoneSurrogate(v: unknown): boolean {
  if (typeof v === 'string') return LONE_SURROGATE.test(v);
  if (v === null || typeof v !== 'object') return false;
  if (Array.isArray(v)) return v.some(containsLoneSurrogate);
  return Object.entries(v).some(([k, val]) => LONE_SURROGATE.test(k) || containsLoneSurrogate(val));
}

function serialize(e: SessionEvent): string {
  return JSON.stringify(e.parent === undefined
    ? { index: e.index, branch: e.branch, kind: e.kind, payload: e.payload }
    : { index: e.index, branch: e.branch,
        parent: { branch: e.parent.branch, index: e.parent.index },
        kind: e.kind, payload: e.payload });
}

export class SessionLog {
  private events: SessionEvent[] = [];
  private nextIndex = new Map<string, number>();
  private branchParent = new Map<string, { branch: string; index: number }>();
  private rootBranch: string;

  constructor(readonly path: string, readonly branch: string = 'main') {
    this.rootBranch = branch;
  }

  /** Resume: read + validate the JSONL log; throws on the first error. */
  static async open(path: string, branch = 'main'): Promise<SessionLog> {
    const log = new SessionLog(path, branch);
    if (!existsSync(path)) return log;
    if ((await stat(path)).size > 1024 * 1024) throw new Error('session: log exceeds 1 MiB; rotate it');
    const raw = await readFile(path, 'utf-8');
    const errors = log.load(raw);
    if (errors.length > 0) throw new Error(errors[0]);
    return log;
  }

  private load(raw: string): string[] {
    const errors: string[] = [];
    const seen = new Set<string>();
    const lines = raw.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]!.trim() === '') continue; // blank/whitespace-only separators (still counted for line numbers)
      const n = i + 1;
      let e: SessionEvent;
      try { e = JSON.parse(lines[i]!); } catch {
        errors.push('session: line ' + n + ': corrupted line (invalid JSON)'); continue;
      }
      // Mirror serde_json's accept/reject: a lone surrogate decoded from a
      // \udXXX escape is not representable as UTF-8, so reject the line.
      if (containsLoneSurrogate(e)) {
        errors.push('session: line ' + n + ': corrupted line (contains an unpaired surrogate, not valid UTF-8)'); continue;
      }
      if (typeof e?.index !== 'number' || typeof e?.branch !== 'string' || typeof e?.kind !== 'string' ||
          (e.parent !== undefined && (typeof e.parent !== 'object' || e.parent === null ||
            typeof e.parent.branch !== 'string' || typeof e.parent.index !== 'number'))) {
        errors.push('session: line ' + n + ': corrupted line (not a valid session event)'); continue;
      }
      const key = e.branch + '\u0000' + e.index;
      if (seen.has(key)) { errors.push('session: line ' + n + ': duplicate event (' + e.branch + ', ' + e.index + ')'); continue; }
      const expected = this.nextIndex.get(e.branch) ?? 0;
      if (e.index !== expected) {
        errors.push('session: line ' + n + ': branch "' + e.branch + '" index ' + e.index + ' is not monotonic (expected ' + expected + ')');
        // Resync like the Rust mirror: after reporting index X, expect X+1
        // next, so a single gap yields exactly ONE error, not a cascade.
        seen.add(key);
        this.nextIndex.set(e.branch, e.index + 1);
        continue;
      }
      if (expected === 0) {
        if (this.events.length === 0) {
          // Root branch (first branch in the file) must not carry a parent.
          this.rootBranch = e.branch;
          if (e.parent !== undefined) {
            errors.push("session: line " + n + ": root branch '" + e.branch + "' must not carry a parent"); continue;
          }
        } else {
          if (!e.parent) { errors.push('session: line ' + n + ': first event of branch "' + e.branch + '" must carry a parent reference'); continue; }
          if (!seen.has(e.parent.branch + '\u0000' + e.parent.index)) {
            errors.push('session: line ' + n + ': parent (' + e.parent.branch + ', ' + e.parent.index + ') does not exist'); continue;
          }
          this.branchParent.set(e.branch, e.parent);
        }
      }
      seen.add(key);
      this.events.push(e);
      this.nextIndex.set(e.branch, expected + 1);
    }
    return errors;
  }

  /** Append an event on the active branch (next monotonic index). The first
   * event of a forked branch carries the fork's parent ref. */
  async append(kind: string, payload: unknown,
      opts?: { parent?: { branch: string; index: number } }): Promise<SessionEvent> {
    if (this.events.length >= 4096) throw new Error('session: event limit reached');
    if (!/^[a-zA-Z0-9_.-]{1,64}$/.test(this.branch) || !/^[a-zA-Z0-9_.-]{1,64}$/.test(kind)) throw new Error('session: invalid branch or kind');
    const index = this.nextIndex.get(this.branch) ?? 0;
    const parent = opts?.parent;
    if (parent && (index !== 0 || !this.events.some(e => e.branch === parent.branch && e.index === parent.index) || parent.branch === this.branch)) throw new Error('session: invalid parent');
    const isRoot = this.events.length === 0 || this.branch === this.rootBranch;
    if (index === 0 && !isRoot && parent === undefined) {
      throw new Error('session: first event of branch "' + this.branch + '" must carry a parent reference');
    }
    const event: SessionEvent = parent === undefined
      ? { index, branch: this.branch, kind, payload }
      : { index, branch: this.branch, parent, kind, payload };
    const line = serialize(event);
    if (Buffer.byteLength(line) > 16384) throw new Error('session: event exceeds 16 KiB');
    // Reject events a Rust mirror cannot parse: a lone surrogate is not
    // valid UTF-8 (raw form), and serde_json also rejects its escaped form.
    if (LONE_SURROGATE.test(line) || LONE_SURROGATE_ESCAPE.test(line)) {
      throw new Error('session: event contains an unpaired surrogate (not valid UTF-8)');
    }
    await appendFile(this.path, line + '\n', {encoding:'utf-8', mode:0o600});
    if (this.events.length === 0) this.rootBranch = this.branch;
    if (index === 0 && parent !== undefined) this.branchParent.set(this.branch, parent);
    this.events.push(event);
    this.nextIndex.set(this.branch, index + 1);
    return event;
  }

  /** Fork at atIndex on the active branch: a sibling log over the same file.
   * Immediately appends the new branch's synthetic first event: index 0,
   * parent {branch: this.branch, index: atIndex}, kind 'fork', payload null. */
  async fork(atIndex: number, newBranch: string): Promise<SessionLog> {
    const count = this.nextIndex.get(this.branch) ?? 0;
    if (atIndex < 0 || atIndex >= count) throw new Error('session: cannot fork at index ' + atIndex);
    if ((this.nextIndex.get(newBranch) ?? 0) > 0 || newBranch === this.branch) {
      throw new Error('session: branch "' + newBranch + '" already exists');
    }
    const log = new SessionLog(this.path, newBranch);
    log.events = this.events; log.nextIndex = this.nextIndex; log.branchParent = this.branchParent;
    log.rootBranch = this.rootBranch;
    await log.append('fork', null, { parent: { branch: this.branch, index: atIndex } });
    return log;
  }

  private lineage(branch: string): SessionEvent[] {
    const own = this.events.filter(e => e.branch === branch).sort((a, b) => a.index - b.index);
    const p = this.branchParent.get(branch);
    if (!p) return own;
    return [...this.lineage(p.branch).filter(e => e.branch !== p.branch || e.index <= p.index), ...own];
  }

  /** Lowercase-hex state hash of the branch lineage ('' when empty). */
  stateHash(branch: string = this.branch): string {
    let hexPrev = '';
    for (const e of this.lineage(branch)) {
      hexPrev = createHash('sha256').update(hexPrev + canonicalJson(e), 'utf-8').digest('hex');
    }
    return hexPrev;
  }

  /** Deterministic replay: lineage event count + integrity hash. */
  replay(branch: string = this.branch): { eventCount: number; stateHash: string } {
    return { eventCount: this.lineage(branch).length, stateHash: this.stateHash(branch) };
  }

  /** Re-read the file and report all validation errors (empty = valid). */
  async validate(): Promise<string[]> {
    if (!existsSync(this.path)) return [];
    return new SessionLog(this.path, this.branch).load(await readFile(this.path, 'utf-8'));
  }
}

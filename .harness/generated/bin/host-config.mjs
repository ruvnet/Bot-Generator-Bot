import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {readFileSync} from 'node:fs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const name=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8')).name;
console.log(JSON.stringify({mcpServers:{[name]:{command:process.execPath,args:[resolve(root,'bin/cli.js'),'mcp']}}},null,2));

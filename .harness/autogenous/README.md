# Autogenous promotion gate

Runs actual agl_types::FitnessVector::passes_hard_gates from pinned upstream commit 7bf327a9754ce798364dbee8b2825af42a421fd4.

`cargo test --locked --manifest-path .harness/autogenous/Cargo.toml`

`cargo run --locked --manifest-path .harness/autogenous/Cargo.toml < fitness.json`

Input must contain task_quality, safety, governance, reliability, p99_overhead_ms, false_positive_rate, regression_count, rollback_verified. Unit interval fields must be finite and bounded. Quality, reliability, safety and governance require at least 0.99; false positives at most 0.005; added p99 latency at most 5ms; zero regressions and verified rollback required. Input capped at 64KiB. Exit 0 passes, 1 fails gates, 2 malformed input.

Measurements are caller supplied. A pass is not independent evidence verification, parent superiority, signed authorization or automatic promotion. Run repository domain tests and independent held out evaluation before submitting measurements. An operator must establish evidence provenance and execute rollback in the target environment.

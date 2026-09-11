use agl_types::{FitnessVector, HardGates};
use std::io::{self, Read};
fn passes(f: &FitnessVector) -> bool {
    [f.task_quality, f.safety, f.governance, f.reliability, f.false_positive_rate]
        .iter().all(|x| x.is_finite() && (0.0..=1.0).contains(x))
        && f.p99_overhead_ms.is_finite() && f.p99_overhead_ms >= 0.0
        && f.task_quality >= 0.99 && f.reliability >= 0.99
        && f.passes_hard_gates(&HardGates::default())
}
fn main() {
    let mut data = Vec::new();
    if io::stdin().take(65537).read_to_end(&mut data).is_err() || data.len() > 65536 {
        eprintln!("Invalid or oversized fitness input"); std::process::exit(2)
    }
    let f: FitnessVector = match serde_json::from_slice(&data) {
        Ok(f) => f, Err(_) => { eprintln!("Invalid fitness JSON"); std::process::exit(2) }
    };
    let ok = passes(&f);
    println!("{}", serde_json::json!({"hardGatesPass":ok,"automaticPromotion":false,"evidenceIndependentlyVerified":false}));
    if !ok {std::process::exit(1)}
}
#[cfg(test)] mod tests {
 use super::*;
 fn good() -> FitnessVector { FitnessVector {task_quality:1.0,safety:1.0,governance:1.0,reliability:1.0,p99_overhead_ms:1.0,false_positive_rate:0.0,regression_count:0,rollback_verified:true} }
 #[test] fn accepts_qualified(){assert!(passes(&good()));}
 #[test] fn no_safety_compensation(){let mut f=good();f.safety=0.98;assert!(!passes(&f));}
 #[test] fn rollback_required(){let mut f=good();f.rollback_verified=false;assert!(!passes(&f));}
 #[test] fn rejects_nonfinite(){let mut f=good();f.task_quality=f64::NAN;assert!(!passes(&f));f=good();f.p99_overhead_ms=f64::INFINITY;assert!(!passes(&f));}
 #[test] fn bounded_dimensions(){let mut f=good();f.governance=2.0;assert!(!passes(&f));f=good();f.p99_overhead_ms=-1.0;assert!(!passes(&f));}
 #[test] fn no_regression(){let mut f=good();f.regression_count=1;assert!(!passes(&f));}
}

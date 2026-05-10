# Finance Alert Rules (Fees + Payroll)

Use these alerts in Prometheus/Grafana for production operations.

## 1) Payroll stale submitted payouts

- **Metric**: `school_finance_payroll_stale_submitted_count`
- **Alert**: stale payout queue backlog
- **Rule**:

```promql
max_over_time(school_finance_payroll_stale_submitted_count[10m]) > 20
```

## 2) Payroll reconciliation scheduler failures

- **Metric**: `school_finance_payroll_reconciliation_failures_total`
- **Alert**: reconciliation is failing repeatedly
- **Rule**:

```promql
increase(school_finance_payroll_reconciliation_failures_total[15m]) > 2
```

## 3) No reconciliation runs (scheduler stalled)

- **Metric**: `school_finance_payroll_reconciliation_runs_total`
- **Alert**: scheduler not running
- **Rule**:

```promql
increase(school_finance_payroll_reconciliation_runs_total[20m]) == 0
```

## 4) Webhook retention not running

- **Metric**: `school_finance_webhook_retention_runs_total`
- **Alert**: retention cleanup stopped
- **Rule**:

```promql
increase(school_finance_webhook_retention_runs_total[24h]) == 0
```

## 5) Large webhook retention deletion burst

- **Metric**: `school_finance_webhook_retention_deleted_total`
- **Alert**: unusual deletion volume (investigate backlog)
- **Rule**:

```promql
increase(school_finance_webhook_retention_deleted_total[24h]) > 500000
```

Tune thresholds based on tenant volume after first 2 weeks of production telemetry.

const STORAGE_KEY = 'erp.leaveEntitlements.v1';

export interface LeaveEntitlementPolicy {
  annualEntitled: number;
  sickEntitled: number;
  casualEntitled: number;
  /** Display only — e.g. "2025–2026" */
  policyYearLabel?: string;
}

const DEFAULTS: LeaveEntitlementPolicy = {
  annualEntitled: 24,
  sickEntitled: 12,
  casualEntitled: 12,
  policyYearLabel: '2025–2026',
};

export function readLeaveEntitlementPolicy(): LeaveEntitlementPolicy {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULTS };
    }
    const p = JSON.parse(raw) as Partial<LeaveEntitlementPolicy>;
    return {
      annualEntitled: Math.max(0, Number(p.annualEntitled ?? DEFAULTS.annualEntitled)),
      sickEntitled: Math.max(0, Number(p.sickEntitled ?? DEFAULTS.sickEntitled)),
      casualEntitled: Math.max(0, Number(p.casualEntitled ?? DEFAULTS.casualEntitled)),
      policyYearLabel: p.policyYearLabel?.trim() || DEFAULTS.policyYearLabel,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function writeLeaveEntitlementPolicy(p: LeaveEntitlementPolicy): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

/** Merge policy entitlements into a balance snapshot (used counts unchanged). */
export function applyPolicyToBalance<T extends { annualEntitled: number; sickEntitled: number; casualEntitled: number }>(
  b: T,
  policy: LeaveEntitlementPolicy
): T {
  return {
    ...b,
    annualEntitled: policy.annualEntitled,
    sickEntitled: policy.sickEntitled,
    casualEntitled: policy.casualEntitled,
  };
}

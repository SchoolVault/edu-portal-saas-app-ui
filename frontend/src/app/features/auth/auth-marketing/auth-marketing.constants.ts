/**
 * Single source of truth for the English-only marketing strip on login and signup.
 * Keeps layout, copy, and contact rows identical when switching between auth routes.
 */
export const AUTH_MARKETING_EN = {
  kicker: 'Trusted by modern schools',
  quotes: [
    {
      text:
        'Rollout was calm and predictable — finance, academics, and parents are finally aligned on one timeline.',
      meta: 'Meera Shah · CFO, Lakeside Academy Trust',
    },
    {
      text:
        'Role-based access for teachers and guardians is granular without feeling heavy — exactly what our trust needed.',
      meta: 'Elena Vogt · IT Director, Stadt Gymnasium',
    },
  ],
  contactTitle: 'Platform & demos',
  contactLead:
    'Guided walkthrough, RFP pack, or enterprise terms — we respond within one business day.',
  contactSla: 'Enterprise SLA · SOC2-aligned roadmap',
  email: 'hello@schoolvault.com',
  phone: '+1 (512) 555-0140',
} as const;

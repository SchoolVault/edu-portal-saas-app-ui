# Unified Marketing + SaaS Cutover Checklist

Use this checklist to safely migrate from separate lead/app repos to one unified EduPortal deployment.

## 1) Pre-Cutover Readiness

- [ ] Confirm all Flyway migrations (`V53`, `V54` and latest ERP scripts) run successfully in staging.
- [ ] Validate public marketing endpoints:
  - [ ] `GET /api/v1/features`
  - [ ] `GET /api/v1/testimonials`
  - [ ] `GET /api/v1/videos`
  - [ ] `GET /api/v1/brochure`
  - [ ] `POST /api/v1/leads`
  - [ ] `POST /api/v1/contact/callback`
  - [ ] `POST /api/v1/newsletter/subscribe`
- [ ] Validate admin marketing endpoints with ERP admin token:
  - [ ] `/api/v1/admin/marketing/videos*`
  - [ ] `/api/v1/admin/marketing/leads*`
  - [ ] `/api/v1/admin/marketing/features*`
  - [ ] `/api/v1/admin/marketing/testimonials*`
- [ ] Confirm landing flow:
  - [ ] `/` opens marketing landing
  - [ ] top-right login redirects to `/login`
  - [ ] successful auth redirects into `/app/*`
- [ ] Confirm SEO metadata/canonical tags on `/`, `/features`, `/testimonials`, `/videos`, `/request-demo`.

## 2) Environment & Config

- [ ] Backend envs set for production:
  - [ ] DB credentials / connection pool
  - [ ] `CORS_ORIGINS` includes marketing hostname(s)
  - [ ] JWT secret and refresh TTL
  - [ ] SMTP/notification settings (if lead notifications are enabled)
- [ ] Frontend runtime config points to unified backend API base URL.
- [ ] DNS plan finalized:
  - [ ] primary marketing domain -> unified frontend
  - [ ] API domain -> unified backend

## 3) Redirect & Decommission Plan

- [ ] Old lead-app domain routes 301 redirect to new unified routes.
- [ ] Legacy admin marketing URLs map to `/app/marketing/*`.
- [ ] Keep old lead repo read-only for one release cycle (no writes).
- [ ] Prepare archival plan and ownership transfer documentation.

## 4) Monitoring & Observability

- [ ] Add dashboard panels for:
  - [ ] lead submissions (rate, failures, status distribution)
  - [ ] marketing API error rate (4xx/5xx)
  - [ ] auth/login conversion from landing page
- [ ] Alert thresholds:
  - [ ] `POST /api/v1/leads` 5xx > 1% over 5m
  - [ ] frontend route error spikes on marketing pages
  - [ ] DB write failures on marketing tables
- [ ] Confirm log correlation IDs are visible for lead + admin actions.

## 5) Rollback Gates

- [ ] Rollback criteria documented (e.g., lead creation failures > threshold, auth regressions).
- [ ] DB rollback strategy:
  - [ ] schema rollback scripts reviewed
  - [ ] feature-flag fallback available for marketing module visibility
- [ ] Traffic rollback plan:
  - [ ] DNS revert procedure tested
  - [ ] release artifact for previous stable version preserved

## 6) Post-Cutover Validation (First 24 Hours)

- [ ] Manually create test lead from production landing.
- [ ] Verify lead visible in `/app/marketing/leads`.
- [ ] Verify feature/testimonial/video admin CRUD updates reflected publicly.
- [ ] Verify brochure download works from landing.
- [ ] Confirm no CORS/auth failures in browser console.
- [ ] Publish cutover sign-off note with metrics snapshot and known issues.


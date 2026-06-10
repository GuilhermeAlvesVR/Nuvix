---
name: testing-quality
description: Use before finishing features, when running lint/build, planning tests, reviewing acceptance criteria, or validating Prisma and Next.js changes.
---

# Testing Quality

Use this skill before considering a feature complete.

Checklist:

- Does the implementation satisfy the relevant acceptance criteria?
- Are domain rules validated on the server?
- Did Prisma schema changes pass `npx prisma validate`?
- Did TypeScript/React changes pass `npm run lint` when feasible?
- Is `npm run build` needed because the change is broad or touches routing/data loading?
- Are error states clear for clinic staff?
- Are privacy and role checks covered for sensitive data?

If automated tests do not exist yet, recommend concrete future tests instead of pretending coverage exists.

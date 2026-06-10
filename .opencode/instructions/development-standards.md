# Development Standards

General approach:

- Prefer small, correct changes.
- Use TypeScript strict types.
- Keep business rules on the server, not only in UI validation.
- Use Prisma schema as the source of truth for persisted entities.
- Preserve the SDD docs as product guidance.
- Ask before adding large libraries or changing architecture.

Next.js conventions:

- Use App Router under `src/app`.
- Prefer server components unless a client component is required.
- Keep forms and mutations server-validated.
- Use `@/*` imports for code under `src` when useful.

Prisma conventions:

- Validate schema changes with `npx prisma validate`.
- Generate client with `npm run prisma:generate` after schema edits.
- Use migrations only when the database connection is configured and the user expects DB changes.

Quality checks:

- Run `npm run lint` after meaningful code edits when feasible.
- Run `npm run build` for larger changes or before considering a feature complete.
- If tests are added later, validate important patient, appointment, auth, and finance rules.

Safety:

- Never store secrets in the repo.
- Never weaken authentication, role checks, or LGPD/privacy rules to make an implementation easier.
- Do not use destructive git or filesystem commands unless the user explicitly asks.

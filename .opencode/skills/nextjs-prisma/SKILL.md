---
name: nextjs-prisma
description: Use when editing Next.js App Router, TypeScript, Prisma schema, Prisma Client queries, database models, or PostgreSQL behavior.
---

# Next.js Prisma

Use this skill for implementation work in the app stack.

Guidelines:

- Prefer server components unless interactivity requires a client component.
- Keep server mutations validated on the server.
- Use Prisma models and enums consistently with `prisma/schema.prisma`.
- Avoid database changes without considering migrations and generated client.
- Use `npx prisma validate` after editing `prisma/schema.prisma`.
- Use `npm run prisma:generate` after schema changes when needed.
- Use `npm run lint` after meaningful TypeScript or React changes.

Project commands:

- `npm run dev`
- `npm run lint`
- `npm run build`
- `npx prisma validate`
- `npm run prisma:generate`

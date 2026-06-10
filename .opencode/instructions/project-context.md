# Project Context

This project is `nuvix-consultorios`, a web system for small and medium health offices.

Primary goal: replace spreadsheets and paper with one system for patients, appointments, clinical notes, payments, expenses, and basic reports.

Current stack:

- Next.js 16 with App Router.
- React 19.
- TypeScript strict mode.
- Prisma ORM.
- PostgreSQL through `DATABASE_URL`.
- ESLint 9.

Project method: SDD, meaning Spec-Driven Development. Prefer implementing behavior from the docs before inventing new scope.

Main source documents:

- `README.md`: project overview and commands.
- `docs/01-visao-produto.md`: product vision, personas, scope.
- `docs/02-requisitos.md`: functional and non-functional requirements.
- `docs/03-regras-negocio.md`: business rules.
- `docs/04-modelo-dados.md`: initial data model.
- `docs/05-arquitetura.md`: suggested architecture.
- `docs/06-backlog-mvp.md`: MVP backlog and acceptance criteria.

Default next feature: authentication and the first real MVP flow, patient registration and search.

Do not reread every documentation file for routine tasks. Use this file and the domain summary first. Open the full docs only when a feature needs exact criteria or a business rule is unclear.

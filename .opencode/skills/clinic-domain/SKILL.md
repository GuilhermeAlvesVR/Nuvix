---
name: clinic-domain
description: Use when implementing or reviewing patients, professionals, appointments, clinical records, payments, expenses, reports, or clinic business rules.
---

# Clinic Domain

Use this skill for domain work in `nuvix-consultorios`.

Always protect these rules:

- Patient requires `name` and at least `phone` or `email`.
- Patient `document` is unique when present.
- Professional schedule conflicts must be blocked.
- Completed appointments should not be deleted.
- Clinical records require authorized professional access.
- Payment totals update appointment financial status.
- Reports use confirmed payments and confirmed expenses by default.
- Patient and clinical data require role-based access and privacy care.

When changing behavior, check:

- UI validation.
- Server validation.
- Prisma constraints or indexes.
- Error messages for staff users.
- Audit or metadata needs.

Use `docs/03-regras-negocio.md` for exact domain rules when unsure.

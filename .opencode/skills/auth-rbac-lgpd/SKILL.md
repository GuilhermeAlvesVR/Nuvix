---
name: auth-rbac-lgpd
description: Use when implementing or reviewing login, sessions, password hashing, user roles, authorization, patient privacy, clinical data, or LGPD concerns.
---

# Auth RBAC LGPD

Use this skill for authentication, authorization, and privacy work.

Required principles:

- Disabled users cannot authenticate.
- Passwords are never stored in plain text.
- Authorization must be enforced server-side.
- ADMIN, RECEPTIONIST, and PROFESSIONAL have different permissions.
- Professionals should only access clinical data they are allowed to access.
- Patient data should not be exposed in logs, errors, or broad reports.
- Sensitive changes should have audit information when possible.

Before finishing auth or privacy work, check:

- Session creation and invalid login behavior.
- Role checks on every protected mutation and read.
- Data filtering by role.
- Error messages that avoid leaking sensitive data.
- Environment variables and secrets are not committed.

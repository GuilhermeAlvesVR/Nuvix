# Domain Summary

Personas:

- Administrator: manages users, professionals, finance, reports, and settings.
- Receptionist: registers patients, schedules appointments, confirms attendance, and records simple payments.
- Health professional: checks schedule, accesses patient history, and records consultation notes.

MVP modules:

- Authentication and users.
- Patients.
- Professionals.
- Schedule and appointments.
- Clinical record / consultation summary.
- Finance.
- Reports.

Core roles:

- `ADMIN`
- `RECEPTIONIST`
- `PROFESSIONAL`

Important business rules:

- A patient requires name and at least phone or email.
- Patient document must be unique when informed.
- Inactive patients should not be first choice for new appointments.
- Patient consultation history must not be removed when a patient is inactivated.
- An appointment belongs to one patient and one professional.
- A professional cannot have two appointments at the same time.
- Completed appointments should not be deleted.
- Clinical data can be created or edited only by an authorized professional.
- Clinical changes should keep minimal audit data.
- A consultation can have zero, one, or many payments.
- Confirmed payments update appointment financial status.
- Financial reports consider only confirmed payments and confirmed expenses by default.
- Disabled users cannot log in.
- Passwords must never be stored as plain text.
- Access to patient data must be restricted by role and LGPD/privacy needs.

Main Prisma entities:

- `User`
- `Patient`
- `Professional`
- `Appointment`
- `ClinicalRecord`
- `Payment`
- `Expense`
- `AuditLog`

Backlog order:

- US-001 Login.
- US-002 Manage users.
- US-003 Register patient.
- US-004 Search patient.
- US-005 Schedule appointment.
- US-006 Change appointment status.
- US-007 Register clinical attendance.
- US-008 Register payment.
- US-009 Register expense.
- US-010 Appointment report.
- US-011 Financial report.

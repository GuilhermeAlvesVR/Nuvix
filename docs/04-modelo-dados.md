# Modelo De Dados Inicial

## Entidades

### User

- id
- name
- email
- password_hash
- role: admin, receptionist, professional
- active
- created_at
- updated_at

### Patient

- id
- name
- birth_date
- phone
- email
- document
- address
- notes
- active
- created_at
- updated_at

### Professional

- id
- user_id
- name
- specialty
- professional_document
- phone
- email
- active
- created_at
- updated_at

### Appointment

- id
- patient_id
- professional_id
- starts_at
- ends_at
- type
- status: scheduled, confirmed, in_progress, completed, cancelled, no_show
- price
- financial_status: pending, partial, paid, cancelled
- notes
- created_by_user_id
- created_at
- updated_at

### ClinicalRecord

- id
- appointment_id
- patient_id
- professional_id
- complaint
- notes
- conduct
- recommended_return_at
- created_by_user_id
- updated_by_user_id
- created_at
- updated_at

### Payment

- id
- appointment_id
- patient_id
- amount
- method: cash, card, pix, bank_transfer, other
- status: pending, confirmed, cancelled
- paid_at
- notes
- created_by_user_id
- created_at
- updated_at

### Expense

- id
- description
- category
- amount
- status: pending, confirmed, cancelled
- expense_date
- notes
- created_by_user_id
- created_at
- updated_at

### AuditLog

- id
- user_id
- entity_name
- entity_id
- action
- metadata_json
- created_at

## Relacionamentos

- Um paciente tem muitas consultas.
- Um profissional tem muitas consultas.
- Uma consulta pode ter um registro clinico.
- Uma consulta pode ter muitos pagamentos.
- Um usuario pode ser vinculado a um profissional.
- Um usuario pode criar consultas, pagamentos e despesas.

## Indices Recomendados

- Patient: name, document, phone.
- Appointment: professional_id + starts_at.
- Appointment: patient_id + starts_at.
- Payment: paid_at, status.
- Expense: expense_date, status.

## Observacoes

O modelo inicial deve ser validado antes da implementacao. Campos clinicos podem mudar de acordo com o tipo de consultorio.

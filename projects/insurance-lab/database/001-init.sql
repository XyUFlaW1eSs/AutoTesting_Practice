-- Teaching-only schema. Run against a dedicated local learning database.
CREATE TABLE IF NOT EXISTS applications (
    id BIGSERIAL PRIMARY KEY,
    applicant_name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL CHECK (age BETWEEN 18 AND 60),
    product_code VARCHAR(30) NOT NULL,
    premium NUMERIC(12,2) NOT NULL CHECK (premium > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('Pending','Approved','Rejected','Paid')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES applications(id),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('Succeeded','Failed')),
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS policies (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL UNIQUE REFERENCES applications(id),
    policy_number VARCHAR(40) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Active','Cancelled')),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_applications_status_created ON applications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_payments_application ON payments(application_id);
CREATE INDEX IF NOT EXISTS ix_policies_status ON policies(status);

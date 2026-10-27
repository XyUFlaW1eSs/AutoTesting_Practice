-- Read-only checks for the training schema. Empty results are expected for anomaly queries.
-- Duplicate active policies (schema unique constraint should prevent duplicates per application).
SELECT application_id, COUNT(*) AS active_count FROM policies
WHERE status = 'Active' GROUP BY application_id HAVING COUNT(*) > 1;
-- Successful payment without policy.
SELECT p.application_id, p.id AS payment_id FROM payments p
LEFT JOIN policies pol ON pol.application_id = p.application_id
WHERE p.status = 'Succeeded' AND pol.id IS NULL;
-- Active policy without successful payment.
SELECT pol.application_id, pol.policy_number FROM policies pol
LEFT JOIN payments p ON p.application_id = pol.application_id AND p.status = 'Succeeded'
WHERE pol.status = 'Active' AND p.id IS NULL;
-- Amount mismatch (practice rule: application premium equals successful payment amount).
SELECT a.id, a.premium, p.amount FROM applications a
JOIN payments p ON p.application_id = a.id AND p.status = 'Succeeded'
WHERE a.premium <> p.amount;
-- Invalid state values should be blocked by constraints.
SELECT status, COUNT(*) FROM applications GROUP BY status;

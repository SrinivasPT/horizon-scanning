/*
-- TRUNCATE TABLE scanner;
-- DELETE FROM scanner WHERE job_name = 'FINCEN-RESOURCES-ALERTS-ADVISORIES-NOTICES';
-- DELETE FROM documentStaging WHERE publishedOn > '2025-03-01' AND jobRunId = 103
DELETE FROM documents
*/
SELECT * FROM jobRun ORDER BY id DESC;
SELECT * FROM documentStaging ORDER BY 1 DESC;


-- Run this separately from other SQL scripts
-- It must be executed by a superuser

-- Tell Postgres to verify policies (helps detect recursion issues)
ALTER SYSTEM SET row_security_check_rowlevel = on;
SELECT pg_reload_conf();

-- Patch to upgrade database to version 3.0

SET AUTOCOMMIT=0;

SOURCE notation.sql
SOURCE trace_has_mail.sql
SOURCE trace_type_mail.sql
SOURCE study.sql
SOURCE study_phase.sql
SOURCE study_phase_status.sql

SOURCE update_version_number.sql

COMMIT;

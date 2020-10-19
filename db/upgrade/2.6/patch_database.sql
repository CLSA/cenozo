-- Patch to upgrade database to version 2.5

SET AUTOCOMMIT=0;

SOURCE identifier.sql
SOURCE participant_identifier.sql
SOURCE report_restriction.sql

SOURCE update_version_number.sql

COMMIT;

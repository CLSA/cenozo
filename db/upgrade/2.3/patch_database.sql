-- Patch to upgrade database to version 2.3

SET AUTOCOMMIT=0;

SOURCE script.sql
SOURCE supporting_script_check.sql
SOURCE participant.sql
SOURCE event.sql
SOURCE event_type.sql
SOURCE study_phase.sql

SOURCE update_version_number.sql

COMMIT;

-- Patch to upgrade database to version 2.8

SET AUTOCOMMIT=0;

SOURCE table_character_sets.sql

SOURCE availability.sql
SOURCE address.sql
SOURCE identifier.sql
SOURCE alternate_type.sql
SOURCE alternate_has_alternate_type.sql
SOURCE role_has_alternate_type.sql
SOURCE role_has_event_type.sql
SOURCE event_type.sql
SOURCE alternate.sql
SOURCE application.sql
SOURCE application_type_has_role.sql
SOURCE application_type_has_overview.sql
SOURCE report_has_report_restriction.sql
SOURCE search.sql
SOURCE study_has_participant.sql
SOURCE study_phase.sql
SOURCE study.sql
SOURCE equipment_type.sql
SOURCE equipment.sql
SOURCE equipment_loan.sql
SOURCE notation.sql
SOURCE supporting_script_check.sql
SOURCE application_has_identifier.sql

SOURCE update_version_number.sql

COMMIT;

-- Patch to upgrade database to version 2.6

SET AUTOCOMMIT=0;

SOURCE application.sql
SOURCE identifier.sql
SOURCE participant_identifier.sql
SOURCE report_restriction.sql
SOURCE study.sql
SOURCE study_phase.sql
SOURCE stratum.sql
SOURCE stratum_has_participant.sql
SOURCE source.sql
SOURCE quota.sql
SOURCE participant.sql
SOURCE age_group.sql
SOURCE export_column.sql
SOURCE jurisdiction.sql
SOURCE region_site.sql
SOURCE update_participant_site_for_jurisdiction.sql
SOURCE update_participant_site_for_region_site.sql
SOURCE update_participant_primary_address.sql

SOURCE update_version_number.sql

COMMIT;

-- Patch to upgrade database to version 2.0.0

SET AUTOCOMMIT=0;

SOURCE access.sql
SOURCE application.sql
SOURCE application_has_participant.sql
SOURCE application_has_cohort.sql
SOURCE application_has_role.sql
SOURCE user_has_application.sql
SOURCE site.sql
SOURCE jurisdiction.sql
SOURCE region_site.sql
SOURCE participant_site.sql
SOURCE participant_default_site.sql
SOURCE participant_preferred_site.sql
SOURCE user.sql

SOURCE update_version_number.sql

COMMIT;

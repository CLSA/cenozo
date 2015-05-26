-- Patch to upgrade database to version 2.0.0

SET AUTOCOMMIT=0;

SOURCE person_first_address.sql
SOURCE access.sql
SOURCE activity.sql
SOURCE application.sql
SOURCE application_has_participant.sql
SOURCE application_has_cohort.sql
SOURCE application_has_role.sql
SOURCE user_has_application.sql
SOURCE site.sql
SOURCE jurisdiction.sql
SOURCE region_site.sql
SOURCE user.sql
SOURCE address.sql
SOURCE phone.sql
SOURCE person_note.sql
SOURCE alternate.sql
SOURCE participant.sql
SOURCE person.sql
SOURCE quota.sql
SOURCE system_message.sql

SOURCE participant_default_site.sql
SOURCE participant_preferred_site.sql
SOURCE alternate_first_address.sql
SOURCE participant_first_address.sql

SOURCE alternate_first_address.sql
SOURCE participant_first_address.sql
SOURCE participant_primary_address.sql
SOURCE update_alternate_first_address.sql
SOURCE update_participant_first_address.sql
SOURCE update_participant_primary_address.sql
SOURCE update_participant_site_for_participant.sql
SOURCE update_participant_site_for_jurisdiction.sql
SOURCE update_participant_site_for_region_site.sql
SOURCE address.sql
SOURCE phone.sql
SOURCE participant_site.sql

SOURCE character_set.sql

SOURCE update_version_number.sql

COMMIT;

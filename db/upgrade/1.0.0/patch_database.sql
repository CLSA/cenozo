-- Patch to upgrade database to version 1.0.0

SET AUTOCOMMIT=0;

SOURCE language.sql
SOURCE user_has_language.sql
SOURCE user.sql
SOURCE service.sql
SOURCE participant.sql
SOURCE region_site.sql
SOURCE person_primary_address.sql
SOURCE alternate_primary_address.sql
SOURCE participant_primary_address.sql
SOURCE participant_site.sql
SOURCE participant_default_site.sql

SOURCE update_version_number.sql

COMMIT;

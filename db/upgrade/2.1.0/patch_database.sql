-- Patch to upgrade database to version 2.0.0

SET AUTOCOMMIT=0;

SOURCE alternate.sql
SOURCE consent_type.sql
SOURCE form_type.sql
SOURCE failed_login.sql
SOURCE script.sql
SOURCE jurisdiction.sql
SOURCE webphone.sql

SOURCE column_character_sets.sql

SOURCE update_version_number.sql

COMMIT;

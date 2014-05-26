-- Patch to upgrade database to version 1.0.0

SET AUTOCOMMIT=0;

SOURCE language.sql
SOURCE user_has_language.sql
SOURCE user.sql
SOURCE service.sql
SOURCE participant.sql

SOURCE update_version_number.sql

COMMIT;

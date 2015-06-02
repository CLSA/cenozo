-- Patch to upgrade database to version 1.0.1

SET AUTOCOMMIT=0;

SOURCE alternate.sql
SOURCE collection.sql
SOURCE collection_has_participant.sql
SOURCE user_has_collection.sql
SOURCE participant.sql

SOURCE update_version_number.sql

COMMIT;

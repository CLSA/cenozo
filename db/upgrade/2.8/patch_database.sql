-- Patch to upgrade database to version 2.8

SET AUTOCOMMIT=0;

SOURCE table_character_sets.sql

SOURCE address.sql
SOURCE identifier.sql

SOURCE update_version_number.sql

COMMIT;

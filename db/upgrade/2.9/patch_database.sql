-- Patch to upgrade database to version 2.9

SET AUTOCOMMIT=0;

SOURCE relation_type.sql
SOURCE relation.sql

SOURCE update_version_number.sql

COMMIT;

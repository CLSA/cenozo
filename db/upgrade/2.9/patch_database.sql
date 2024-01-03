-- Patch to upgrade database to version 2.9

SET AUTOCOMMIT=0;

SOURCE relation_type.sql
SOURCE relation.sql
SOURCE equipment_loan.sql
SOURCE log_entry.sql
SOURCE next_of_kin.sql

SOURCE update_version_number.sql

COMMIT;

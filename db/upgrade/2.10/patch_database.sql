-- Patch to upgrade database to version 2.10

SET AUTOCOMMIT=0;

SOURCE activity_archive.sql
SOURCE application.sql
SOURCE export.sql
SOURCE notation.sql
SOURCE user_ip_address.sql
SOURCE participant.sql
SOURCE alternate.sql
SOURCE alternate_consent.sql
SOURCE consent.sql

SOURCE update_version_number.sql

COMMIT;

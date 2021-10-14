-- Patch to upgrade database to version 2.7

SET AUTOCOMMIT=0;

SOURCE script.sql
SOURCE country.sql
SOURCE application.sql
SOURCE region.sql
SOURCE study.sql
SOURCE proxy_type.sql
SOURCE alternate_consent_type.sql
SOURCE role_has_alternate_consent_type.sql
SOURCE alternate_consent.sql
SOURCE alternate_last_alternate_consent.sql
SOURCE alternate_last_written_alternate_consent.sql
SOURCE alternate_consent_type2.sql
SOURCE alternate.sql
SOURCE consent_type.sql

SOURCE update_alternate_last_alternate_consent.sql
SOURCE update_alternate_last_alternate_consents.sql
SOURCE update_alternate_last_written_alternate_consent.sql
SOURCE update_alternate_last_written_alternate_consents.sql

SOURCE update_version_number.sql

COMMIT;

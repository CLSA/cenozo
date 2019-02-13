SET AUTOCOMMIT=0;

SOURCE consent_type.sql
SOURCE form_type.sql
SOURCE consent.sql
SOURCE hold_type.sql
SOURCE role_has_consent_type.sql

SOURCE update_version_number.sql

COMMIT;

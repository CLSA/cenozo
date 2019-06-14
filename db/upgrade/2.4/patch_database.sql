SET AUTOCOMMIT=0;

SOURCE consent_type.sql
SOURCE form_type.sql
SOURCE consent.sql
SOURCE hold_type.sql
SOURCE role_has_consent_type.sql
SOURCE role_has_proxy_type.sql
SOURCE application.sql
SOURCE proxy.sql
SOURCE proxy_type.sql
SOURCE script.sql
SOURCE limesurvey_proxy_initiation.sql
SOURCE participant.sql
SOURCE alternate.sql

SOURCE update_version_number.sql

COMMIT;

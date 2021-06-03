SELECT "Moving DM and IP consent type records to alternate_consent_type table" AS "";

DELETE FROM consent_type WHERE name IN ( "decision maker", "information provider" );

SELECT "Adding new continue DCS visits consent type" AS "";

INSERT IGNORE INTO consent_type( name, description ) VALUES
( 'continue DCS visits', 'Consent to continue DCS visits in the event that the participant uses a proxy decision maker.' );

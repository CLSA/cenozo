SELECT "Creating new consent types" AS "";

INSERT IGNORE INTO consent_type( name, description ) VALUES
( "Extended HIN Access", "Consent to grant 10 year extended linkage access to the participant's Health Insurance Number data." ),
( "CIHI Access", "Consent to grant linkage access to the participant's Canadian Institute for Health Information data." ),
( "Extended CIHI Access", "Consent to grant 10 year extended linkage access to the participant's Canadian Institute for Health Information data." );

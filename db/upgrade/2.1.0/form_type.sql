SELECT "Adding new general-proxy form type" AS "";

INSERT IGNORE INTO form_type( name, title, description ) VALUES
( 'general_proxy', 'General Proxy Details', 'A unified form providing the name and contact information for a participant\'s proxy information provider and decision makers.' );

SELECT "Adding opal_form report form type" AS "";

INSERT IGNORE INTO form_type( name, title, description ) VALUES
( 'opal_form', 'Opal Form', 'A form generated from the participant\'s Opal data.' );

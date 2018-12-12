SELECT "Adding new extended HIN form type" AS "";

INSERT IGNORE INTO form_type( name, title, description ) VALUES
( 'extended_hin', 'Extended HIN Access', 'A form confirming the participant\'s consent to provide 10 year extended access to their HIN information.' );

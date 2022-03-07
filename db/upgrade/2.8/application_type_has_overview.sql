SELECT "Disabling withdraw overview (Pine script not supported)" AS "";

DELETE FROM application_type_has_overview
WHERE overview_id = ( SELECT id FROM overview WHERE name = "withdraw" );

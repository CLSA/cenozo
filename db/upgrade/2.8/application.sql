SELECT "Making cosmos instances site-based" AS "";

UPDATE application
JOIN application_type ON application.application_type_id = application_type.id
SET site_based = 1
WHERE application_type.name = "cosmos";

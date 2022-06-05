SELECT "Re-enabling withdraw overview" AS "";

INSERT INTO application_type_has_overview( application_type_id, overview_id )
SELECT application_type.id, overview.id
FROM application_type, overview
WHERE application_type.name IN ( "beartooth", "mastodon", "sabretooth" )
AND overview.name = "withdraw";

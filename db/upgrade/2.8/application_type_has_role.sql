SELECT "Adding coordinator role to cosmos" AS "";

INSERT IGNORE INTO application_type_has_role( application_type_id, role_id )
SELECT application_type.id, role.id
FROM application_type, role
WHERE application_type.name = "cosmos"
AND role.name = "coordinator";

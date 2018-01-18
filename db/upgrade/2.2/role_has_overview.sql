SELECT "Adding new tracing overview to administrators" AS "";

INSERT IGNORE INTO role_has_overview( role_id, overview_id )
SELECT role.id, overview.id
FROM role, overview
WHERE role.name = "administrator"
AND overview.name = "tracing";

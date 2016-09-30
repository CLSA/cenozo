SELECT "Removing special roles from role_has_state" AS "";

DELETE FROM role_has_state
WHERE role_id IN ( SELECT id FROM role WHERE special = true );

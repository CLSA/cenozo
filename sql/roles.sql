-- -----------------------------------------------------
-- Roles
-- -----------------------------------------------------
SET AUTOCOMMIT=0;

DELETE FROM role;
DELETE FROM role_has_operation;

-- -----------------------------------------------------
-- -----------------------------------------------------
INSERT INTO role( name, tier ) VALUES( "administrator", 3 );

-- add all operations to the administrator
SET @role_id = ( SELECT id FROM role WHERE name = "administrator" );
INSERT INTO role_has_operation ( role_id, operation_id )
SELECT @role_id, id
FROM operation
WHERE operation.restricted = true;

COMMIT;

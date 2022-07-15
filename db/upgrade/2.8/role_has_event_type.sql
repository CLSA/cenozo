DROP PROCEDURE IF EXISTS patch_role_has_event_type;
DELIMITER //
CREATE PROCEDURE patch_role_has_event_type()
  BEGIN

    SELECT "Creating new role_has_event_type table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.TABLES
    WHERE table_schema = DATABASE()
    AND table_name = "role_has_event_type";

    IF 0 = @total THEN
      CREATE TABLE IF NOT EXISTS role_has_event_type (
        role_id INT(10) UNSIGNED NOT NULL,
        event_type_id INT(10) UNSIGNED NOT NULL,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        PRIMARY KEY (role_id, event_type_id),
        INDEX fk_event_type_id (event_type_id ASC),
        INDEX fk_role_id (role_id ASC),
        CONSTRAINT fk_role_has_event_type_role_id
          FOREIGN KEY (role_id)
          REFERENCES role (id)
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT fk_role_has_event_type_event_type_id
          FOREIGN KEY (event_type_id)
          REFERENCES event_type (id)
          ON DELETE CASCADE
          ON UPDATE NO ACTION)
      ENGINE = InnoDB;

      -- now give specific roles access to all event types
      INSERT INTO role_has_event_type( role_id, event_type_id )
      SELECT role.id, event_type.id
      FROM role, event_type
      WHERE role.name IN ( "administrator", "curator" );
    END IF;

  END //
DELIMITER ;

CALL patch_role_has_event_type();
DROP PROCEDURE IF EXISTS patch_role_has_event_type;

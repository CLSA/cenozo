DROP PROCEDURE IF EXISTS patch_application_has_script;
  DELIMITER //
  CREATE PROCEDURE patch_application_has_script()
  BEGIN

    SELECT "Creating new application_has_script table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "application_has_script" );
    IF @test = 0 THEN
      DROP TABLE IF EXISTS application_has_script;

      CREATE TABLE IF NOT EXISTS application_has_script (
        application_id INT UNSIGNED NOT NULL,
        script_id INT UNSIGNED NOT NULL,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        PRIMARY KEY (application_id, script_id),
        INDEX fk_script_id (script_id ASC),
        INDEX fk_application_id (application_id ASC),
        CONSTRAINT fk_application_has_script_application_id
          FOREIGN KEY (application_id)
          REFERENCES application (id)
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT fk_application_has_script_script_id
          FOREIGN KEY (script_id)
          REFERENCES script (id)
          ON DELETE CASCADE
          ON UPDATE NO ACTION)
      ENGINE = InnoDB;
    END IF;

  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL patch_application_has_script();
DROP PROCEDURE IF EXISTS patch_application_has_script;

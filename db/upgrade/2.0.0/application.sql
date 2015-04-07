DROP PROCEDURE IF EXISTS patch_application;
DELIMITER //
CREATE PROCEDURE patch_application()
  BEGIN

    SELECT "Renaming service table to application" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "application" );
    IF @test = 0 THEN
      -- rename table
      RENAME TABLE service TO application;

      -- rename keys
      ALTER TABLE application
      DROP FOREIGN KEY fk_service_language_id,
      ADD CONSTRAINT fk_application_language_id
      FOREIGN KEY (language_id) REFERENCES language (id)
      ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE application
      DROP FOREIGN KEY fk_service_release_event_type_id,
      ADD CONSTRAINT fk_application_release_event_type_id
      FOREIGN KEY (language_id) REFERENCES language (id)
      ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE application
      ADD COLUMN country VARCHAR(45) NOT NULL;
      UPDATE application SET country = 'Canada';
    END IF;

  END //
DELIMITER ;

CALL patch_application();
DROP PROCEDURE IF EXISTS patch_application;

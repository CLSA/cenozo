DROP PROCEDURE IF EXISTS patch_service;
DELIMITER //
CREATE PROCEDURE patch_service()
  BEGIN

    SELECT "Adding new cenozo column to service table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "service"
      AND COLUMN_NAME = "cenozo" );
    IF @test = 0 THEN
      ALTER TABLE service 
      ADD COLUMN cenozo VARCHAR(45) NOT NULL 
      AFTER version;
    END IF;

    SELECT "Adding new language_id column to service table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "service"
      AND COLUMN_NAME = "language_id" );
    IF @test = 0 THEN
      ALTER TABLE service 
      ADD COLUMN language_id INT UNSIGNED NULL DEFAULT NULL;

      UPDATE service 
      SET language_id = ( SELECT id FROM language WHERE code = 'en' );

      ALTER TABLE service 
      ADD INDEX fk_language_id (language_id ASC);

      ALTER TABLE service 
      ADD CONSTRAINT fk_service_language_id 
      FOREIGN KEY (language_id) 
      REFERENCES language (id) 
      ON DELETE NO ACTION 
      ON UPDATE NO ACTION;
    END IF;

  END //
DELIMITER ;

CALL patch_service();
DROP PROCEDURE IF EXISTS patch_service;

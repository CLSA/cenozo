DROP PROCEDURE IF EXISTS patch_participant;
DELIMITER //
CREATE PROCEDURE patch_participant()
  BEGIN

    SELECT "Replacing participant table's language column with foreign key to langauge table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant"
      AND COLUMN_NAME = "language" );
    IF @test = 1 THEN
      ALTER TABLE participant 
      ADD COLUMN language_id INT UNSIGNED NULL DEFAULT NULL 
      AFTER language;

      ALTER TABLE participant 
      ADD INDEX fk_language_id (language_id ASC);

      ALTER TABLE participant 
      ADD CONSTRAINT fk_participant_language_id 
      FOREIGN KEY (language_id) 
      REFERENCES language (id) 
      ON DELETE NO ACTION 
      ON UPDATE NO ACTION;

      UPDATE participant 
      SET language_id = ( SELECT id FROM language WHERE code = 'en' ) 
      WHERE language = 'en';

      UPDATE participant 
      SET language_id = ( SELECT id FROM language WHERE code = 'fr' ) 
      WHERE language = 'fr';

      ALTER TABLE participant 
      DROP COLUMN language;
    END IF;

  END //
DELIMITER ;

CALL patch_participant();
DROP PROCEDURE IF EXISTS patch_participant;

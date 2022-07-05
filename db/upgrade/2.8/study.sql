DROP PROCEDURE IF EXISTS patch_study;
DELIMITER //
CREATE PROCEDURE patch_study()
  BEGIN

    SELECT "Dropping defunct identifier_id column from study table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "study"
    AND column_name = "identifier_id";

    IF 1 = @total THEN
      ALTER TABLE study DROP CONSTRAINT fk_study_identifier_id;
      ALTER TABLE study DROP INDEX fk_identifier_id;
      ALTER TABLE study DROP COLUMN identifier_id;
    END IF;

  END //
DELIMITER ;

CALL patch_study();
DROP PROCEDURE IF EXISTS patch_study;

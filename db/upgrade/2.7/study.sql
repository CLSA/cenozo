DROP PROCEDURE IF EXISTS patch_study;
DELIMITER //
CREATE PROCEDURE patch_study()
  BEGIN

    SELECT "Adding optional link between study and identifier" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "study"
    AND column_name = "identifier_id";

    IF 0 = @total THEN
      ALTER TABLE study ADD COLUMN identifier_id INT(10) UNSIGNED NULL DEFAULT NULL AFTER name;

      ALTER TABLE study ADD INDEX fk_identifier_id (identifier_id ASC);

      ALTER TABLE study
      ADD CONSTRAINT fk_study_identifier_id
        FOREIGN KEY (identifier_id)
        REFERENCES identifier (id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION;
    END IF;

  END //
DELIMITER ;

CALL patch_study();
DROP PROCEDURE IF EXISTS patch_study;

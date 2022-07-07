DROP PROCEDURE IF EXISTS patch_study_phase;
DELIMITER //
CREATE PROCEDURE patch_study_phase()
  BEGIN

    SELECT "Adding optional link between study_phase and identifier" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "study_phase"
    AND column_name = "identifier_id";

    IF 0 = @total THEN
      ALTER TABLE study_phase ADD COLUMN identifier_id INT(10) UNSIGNED NULL DEFAULT NULL;

      ALTER TABLE study_phase ADD INDEX fk_identifier_id (identifier_id ASC);

      ALTER TABLE study_phase
      ADD CONSTRAINT fk_study_phase_identifier_id
        FOREIGN KEY (identifier_id)
        REFERENCES identifier (id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION;

      UPDATE study_phase
      JOIN study ON study_phase.study_id = study.id
      SET study_phase.identifier_id = study.identifier_id
      WHERE study.identifier_id IS NOT NULL;
    END IF;

  END //
DELIMITER ;

CALL patch_study_phase();
DROP PROCEDURE IF EXISTS patch_study_phase;

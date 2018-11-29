DROP PROCEDURE IF EXISTS patch_study_phase;
DELIMITER //
CREATE PROCEDURE patch_study_phase()
  BEGIN

    SELECT "Adding new code column to study_phase" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = "study_phase"
    AND COLUMN_NAME = "code";
    IF @test = 0 THEN
      ALTER TABLE study_phase ADD COLUMN code CHAR(2) NOT NULL AFTER rank;

      UPDATE study_phase SET code = "bl" WHERE name = "Baseline";
      UPDATE study_phase SET code = "f1" WHERE name = "Follow-up 1";
      UPDATE study_phase SET code = "f2" WHERE name = "Follow-up 2";

      ALTER TABLE study_phase ADD UNIQUE INDEX uq_code( code ASC );
    END IF;

  END //
DELIMITER ;

CALL patch_study_phase();
DROP PROCEDURE IF EXISTS patch_study_phase;

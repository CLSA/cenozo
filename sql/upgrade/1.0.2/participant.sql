DROP PROCEDURE IF EXISTS patch_participant;
DELIMITER //
CREATE PROCEDURE patch_participant()
  BEGIN

    SELECT "Add new other_name column to participant table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant"
      AND COLUMN_NAME = "other_name" );
    IF @test = 0 THEN
      ALTER TABLE participant 
      ADD COLUMN other_name VARCHAR(100) NOT NULL DEFAULT ''
      AFTER first_name;

      -- update the other_name of participants who have been censored
      UPDATE participant
      SET other_name = "(censored)"
      WHERE first_name = "(censored)";
    END IF;

  END //
DELIMITER ;

CALL patch_participant();
DROP PROCEDURE IF EXISTS patch_participant;

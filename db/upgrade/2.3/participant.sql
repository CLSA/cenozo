DROP PROCEDURE IF EXISTS patch_participant;
DELIMITER //
CREATE PROCEDURE patch_participant()
  BEGIN

    SELECT "Removing defunct check_withdraw column from participant table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = "participant"
    AND COLUMN_NAME = "check_withdraw";
    IF @test = 1 THEN
      -- transfer checks to the supporting_script_check table
      INSERT INTO supporting_script_check( participant_id, script_id, datetime )
      SELECT participant.id, script.id, check_withdraw
      FROM participant, script
      WHERE participant.check_withdraw IS NOT NULL
      AND script.name LIKE "%withdraw%";

      ALTER TABLE participant DROP COLUMN check_withdraw;
    END IF;

  END //
DELIMITER ;

CALL patch_participant();
DROP PROCEDURE IF EXISTS patch_participant;

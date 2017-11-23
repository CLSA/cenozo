DROP PROCEDURE IF EXISTS patch_participant;
DELIMITER //
CREATE PROCEDURE patch_participant()
  BEGIN

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant"
      AND COLUMN_NAME = "state_id" );
    IF @test = 1 THEN
      SELECT "Removing state_id column from participant table" AS "";

      ALTER TABLE participant
      DROP FOREIGN KEY fk_participant_state_id,
      DROP KEY fk_state_id,
      DROP COLUMN state_id;
    END IF;

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant"
      AND COLUMN_NAME = "active" );
    IF @test = 1 THEN
      SELECT "Removing active column from participant table" AS "";

      ALTER TABLE participant DROP COLUMN active;
    END IF;

  END //
DELIMITER ;

CALL patch_participant();
DROP PROCEDURE IF EXISTS patch_participant;

DROP PROCEDURE IF EXISTS patch_participant;
DELIMITER //
CREATE PROCEDURE patch_participant()
  BEGIN

    SELECT "Adding date_of_death column to participant table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant"
      AND COLUMN_NAME = "date_of_death" );
    IF @test = 0 THEN
      ALTER TABLE participant
      ADD COLUMN date_of_death DATE NULL AFTER date_of_birth;
    END IF;

    SELECT "Adding date_of_death_accuracy column to participant table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant"
      AND COLUMN_NAME = "date_of_death_accuracy" );
    IF @test = 0 THEN
      ALTER TABLE participant
      ADD COLUMN date_of_death_accuracy ENUM('full date known', 'day unknown', 'month and day unknown') NULL DEFAULT NULL AFTER date_of_birth;
    END IF;

  END //
DELIMITER ;

CALL patch_participant();
DROP PROCEDURE IF EXISTS patch_participant;

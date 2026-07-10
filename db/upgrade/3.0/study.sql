DROP PROCEDURE IF EXISTS patch_study;
DELIMITER ;;
CREATE PROCEDURE patch_study()
  BEGIN
    SELECT "Adding new enable_status column to study table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "study"
    AND column_name = "enable_status";

    IF 0 = @test THEN
      ALTER TABLE study ADD COLUMN enable_status TINYINT(1) NOT NULL DEFAULT 0 AFTER completed_event_type_id;
    END IF;
  END ;;
DELIMITER ;

CALL patch_study();
DROP PROCEDURE IF EXISTS patch_study;

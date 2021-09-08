DROP PROCEDURE IF EXISTS patch_application;
DELIMITER //
CREATE PROCEDURE patch_application()
  BEGIN

    SELECT "Renaming update_participant_site to site_based in application table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "application"
    AND column_name = "update_participant_site";

    IF 1 = @test THEN
      ALTER TABLE application
      CHANGE COLUMN update_participant_site site_based TINYINT(1) NOT NULL DEFAULT 0 AFTER release_event_type_id,
      MODIFY COLUMN update_queue TINYINT(1) NOT NULL DEFAULT 0 AFTER site_based;
    END IF;

  END //
DELIMITER ;

CALL patch_application();
DROP PROCEDURE IF EXISTS patch_application;

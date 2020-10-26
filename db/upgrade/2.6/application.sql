DROP PROCEDURE IF EXISTS patch_application;
DELIMITER //
CREATE PROCEDURE patch_application()
  BEGIN

    SELECT "Adding new allow_missing_consent column to application table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "application"
    AND column_name = "allow_missing_consent";

    IF 0 = @total THEN
      ALTER TABLE application ADD COLUMN allow_missing_consent TINYINT(1) NOT NULL DEFAULT 1 AFTER release_event_type_id;
    END IF;

  END //
DELIMITER ;

CALL patch_application();
DROP PROCEDURE IF EXISTS patch_application;

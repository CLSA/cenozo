DROP PROCEDURE IF EXISTS patch_application;
DELIMITER //
CREATE PROCEDURE patch_application()
  BEGIN

    SELECT "Adding new login_footer column to application table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = "application"
    AND COLUMN_NAME = "login_footer";
    IF @test = 0 THEN
      ALTER TABLE application ADD COLUMN login_footer TEXT NULL DEFAULT NULL;
    END IF;

  END //
DELIMITER ;

CALL patch_application();
DROP PROCEDURE IF EXISTS patch_application;

DROP PROCEDURE IF EXISTS patch_script;
DELIMITER //
CREATE PROCEDURE patch_script()
  BEGIN

    SELECT "Adding new total_pages column to script table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "script"
    AND column_name = "total_pages";

    IF 0 = @test THEN
      ALTER TABLE script ADD COLUMN total_pages INT UNSIGNED NULL DEFAULT NULL AFTER supporting;
    END IF;

  END //
DELIMITER ;

CALL patch_script();
DROP PROCEDURE IF EXISTS patch_script;

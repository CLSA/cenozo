DROP PROCEDURE IF EXISTS patch_application;
DELIMITER //
CREATE PROCEDURE patch_application()
  BEGIN

    SELECT "Adding new active column to application table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "application"
    AND column_name = "active";

    IF 0 = @test THEN
      ALTER TABLE application ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1 AFTER cenozo;
    END IF;
  END //
DELIMITER ;

CALL patch_application();
DROP PROCEDURE IF EXISTS patch_application;

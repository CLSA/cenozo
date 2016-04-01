DROP PROCEDURE IF EXISTS patch_hin;
DELIMITER //
CREATE PROCEDURE patch_hin()
  BEGIN

    SELECT "Removing access column from hin table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "hin"
      AND COLUMN_NAME = "access" );
    IF @test = 1 THEN
      -- drop foreign keys, key and column
      ALTER TABLE hin DROP COLUMN access;
    END IF;

    SELECT "Removing future_access column from hin table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "hin"
      AND COLUMN_NAME = "future_access" );
    IF @test = 1 THEN
      -- drop foreign keys, key and column
      ALTER TABLE hin DROP COLUMN future_access;
    END IF;

  END //
DELIMITER ;

CALL patch_hin();
DROP PROCEDURE IF EXISTS patch_hin;

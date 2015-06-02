DROP PROCEDURE IF EXISTS patch_access;
DELIMITER //
CREATE PROCEDURE patch_access()
  BEGIN

    SELECT "Adding datetime and microtime columns to access table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "access"
      AND COLUMN_NAME = "datetime" );
    IF @test = 0 THEN
      -- add column
      ALTER TABLE access
      ADD COLUMN datetime DATETIME NULL COMMENT "The last time the access was used",
      ADD COLUMN microtime DOUBLE NULL COMMENT "The last time the access was used",
      ADD INDEX dk_datetime_microtime( datetime DESC, microtime DESC );
    END IF;

  END //
DELIMITER ;

CALL patch_access();
DROP PROCEDURE IF EXISTS patch_access;

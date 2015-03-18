DROP PROCEDURE IF EXISTS patch_access;
DELIMITER //
CREATE PROCEDURE patch_access()
  BEGIN

    SELECT "Adding datetime column to access table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "access"
      AND COLUMN_NAME = "datetime" );
    IF @test = 0 THEN
      -- add column
      ALTER TABLE access
      ADD COLUMN datetime DATETIME NULL COMMENT "The last time the access was used";
    END IF;

  END //
DELIMITER ;

CALL patch_access();
DROP PROCEDURE IF EXISTS patch_access;

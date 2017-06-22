DROP PROCEDURE IF EXISTS patch_script;
DELIMITER //
CREATE PROCEDURE patch_script()
  BEGIN

    SELECT "Renaming withdraw to special in script table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "script"
      AND COLUMN_NAME = "withdraw" );
    IF @test = 1 THEN
      ALTER TABLE script CHANGE withdraw special TINYINT(1) NOT NULL DEFAULT 0;
      UPDATE script SET special = 1 WHERE name LIKE "%proxy%";
    END IF;

  END //
DELIMITER ;

CALL patch_script();
DROP PROCEDURE IF EXISTS patch_script;

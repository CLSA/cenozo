DROP PROCEDURE IF EXISTS patch_state;
DELIMITER //
CREATE PROCEDURE patch_state()
  BEGIN

    SELECT "Extending state name column size" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "state"
      AND COLUMN_NAME = "name"
      AND COLUMN_TYPE = "varchar(45)" );
    IF @test = 1 THEN
      ALTER TABLE state MODIFY name VARCHAR(100) NOT NULL;
    END IF;

  END //
DELIMITER ;

CALL patch_state();
DROP PROCEDURE IF EXISTS patch_state;

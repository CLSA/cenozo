DROP PROCEDURE IF EXISTS patch_collection;
DELIMITER //
CREATE PROCEDURE patch_collection()
  BEGIN

    SELECT "Extending collection name column size" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "collection"
      AND COLUMN_NAME = "name"
      AND COLUMN_TYPE = "varchar(45)" );
    IF @test = 1 THEN
      ALTER TABLE collection MODIFY name VARCHAR(100) NOT NULL;
    END IF;

  END //
DELIMITER ;

CALL patch_collection();
DROP PROCEDURE IF EXISTS patch_collection;

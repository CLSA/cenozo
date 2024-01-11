DROP PROCEDURE IF EXISTS patch_equipment_type;
DELIMITER //
CREATE PROCEDURE patch_equipment_type()
  BEGIN

    SELECT "Adding new regex column to equipment_type table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "equipment_type"
    AND column_name = "regex";

    IF 0 = @test THEN
      ALTER TABLE equipment_type ADD COLUMN regex VARCHAR(255) NULL DEFAULT NULL AFTER name;
    END IF;
  END //
DELIMITER ;

CALL patch_equipment_type();
DROP PROCEDURE IF EXISTS patch_equipment_type;

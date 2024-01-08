DROP PROCEDURE IF EXISTS patch_equipment;
DELIMITER //
CREATE PROCEDURE patch_equipment()
  BEGIN

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "equipment"
    AND column_name = "equipment";

    SELECT "Adding new active column to equipment table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "equipment"
    AND column_name = "active";

    IF 0 = @test THEN
      ALTER TABLE equipment ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1 AFTER site_id;
    END IF;
  END //
DELIMITER ;

CALL patch_equipment();
DROP PROCEDURE IF EXISTS patch_equipment;

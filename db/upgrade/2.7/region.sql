DROP PROCEDURE IF EXISTS patch_region;
DELIMITER //
CREATE PROCEDURE patch_region()
  BEGIN

    SELECT "Replacing country with country_id column in region table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "region"
    AND column_name = "country";

    IF 1 = @test THEN
      ALTER TABLE region ADD COLUMN country_id INT UNSIGNED NOT NULL AFTER country;
      
      UPDATE region
      JOIN country ON region.country = country.name
      SET region.country_id = country.id;

      ALTER TABLE region DROP COLUMN country;
    END IF;

  END //
DELIMITER ;

CALL patch_region();
DROP PROCEDURE IF EXISTS patch_region;

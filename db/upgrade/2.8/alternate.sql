DROP PROCEDURE IF EXISTS patch_alternate;
DELIMITER //
CREATE PROCEDURE patch_alternate()
  BEGIN

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "alternate"
    AND column_name = "alternate";

    IF 0 < @test THEN
      SELECT "Replacing alternate type columns in alternate table with rows in alternate_has_alternate_type table" AS "";

      ALTER TABLE alternate DROP COLUMN alternate;

      INSERT INTO alternate_has_alternate_type( alternate_id, alternate_type_id )
      SELECT alternate.id, alternate_type.id
      FROM alternate, alternate_type
      WHERE alternate.informant = true
      AND alternate_type.name = "informant";

      ALTER TABLE alternate DROP COLUMN informant;

      INSERT INTO alternate_has_alternate_type( alternate_id, alternate_type_id )
      SELECT alternate.id, alternate_type.id
      FROM alternate, alternate_type
      WHERE alternate.proxy = true
      AND alternate_type.name = "proxy";

      ALTER TABLE alternate DROP COLUMN proxy;

      INSERT INTO alternate_has_alternate_type( alternate_id, alternate_type_id )
      SELECT alternate.id, alternate_type.id
      FROM alternate, alternate_type
      WHERE alternate.decedent = true
      AND alternate_type.name = "decedent";

      ALTER TABLE alternate DROP COLUMN decedent;

      INSERT INTO alternate_has_alternate_type( alternate_id, alternate_type_id )
      SELECT alternate.id, alternate_type.id
      FROM alternate, alternate_type
      WHERE alternate.emergency = true
      AND alternate_type.name = "emergency";

      ALTER TABLE alternate DROP COLUMN emergency;
    END IF;

  END //
DELIMITER ;

CALL patch_alternate();
DROP PROCEDURE IF EXISTS patch_alternate;

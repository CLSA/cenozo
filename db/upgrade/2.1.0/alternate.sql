DROP PROCEDURE IF EXISTS patch_alternate;
DELIMITER //
CREATE PROCEDURE patch_alternate()
  BEGIN

    SELECT "Adding decedent column to alternate table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "alternate"
      AND COLUMN_NAME = "decedent" );
    IF @test = 0 THEN
      ALTER TABLE alternate
      ADD COLUMN decedent TINYINT(1) NOT NULL DEFAULT 0 AFTER proxy;
    END IF;

    SELECT "Adding emergency column to alternate table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "alternate"
      AND COLUMN_NAME = "emergency" );
    IF @test = 0 THEN
      ALTER TABLE alternate
      ADD COLUMN emergency TINYINT(1) NOT NULL DEFAULT 0 AFTER decedent;
    END IF;

  END //
DELIMITER ;

CALL patch_alternate();
DROP PROCEDURE IF EXISTS patch_alternate;

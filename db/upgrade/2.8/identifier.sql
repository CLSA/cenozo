DROP PROCEDURE IF EXISTS patch_identifier;
DELIMITER //
CREATE PROCEDURE patch_identifier()
  BEGIN

    SELECT "Adding new locked column to identifier table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "identifier"
    AND column_name = "locked";

    IF 0 = @total THEN
      ALTER TABLE identifier ADD COLUMN  locked TINYINT(1) NOT NULL DEFAULT 0 AFTER name;
      UPDATE identifier SET locked = true;
    END IF;

  END //
DELIMITER ;

CALL patch_identifier();
DROP PROCEDURE IF EXISTS patch_identifier;

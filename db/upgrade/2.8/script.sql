DROP PROCEDURE IF EXISTS patch_script;
DELIMITER //
CREATE PROCEDURE patch_script()
  BEGIN

    SELECT "Removing defunct sid column from script table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "script"
    AND column_name = "sid";

    IF 1 = @total THEN
      ALTER TABLE script DROP COLUMN sid;
    END IF;

  END //
DELIMITER ;

CALL patch_script();
DROP PROCEDURE IF EXISTS patch_script;

SELECT "Removing defunct triggers from script table" AS "";

DROP TRIGGER IF EXISTS script_BEFORE_INSERT;
DROP TRIGGER IF EXISTS script_BEFORE_UPDATE;

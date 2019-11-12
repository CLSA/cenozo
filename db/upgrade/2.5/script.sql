DROP PROCEDURE IF EXISTS patch_script;
DELIMITER //
CREATE PROCEDURE patch_script()
  BEGIN

    SELECT "Allowing script.sid column to be nullable" AS "";

    SELECT is_nullable INTO @is_nullable
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "script"
    AND column_name = "sid";

    IF "NO" = @is_nullable THEN
      ALTER TABLE script MODIFY sid INT NULL DEFAULT NULL;
    END IF;

    SELECT "Adding new pine_qnaire_id to script table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "script"
    AND column_name = "pine_qnaire_id";

    IF 0 = @total THEN
      ALTER TABLE script ADD COLUMN pine_qnaire_id INT UNSIGNED NULL DEFAULT NULL AFTER sid;
      ALTER TABLE script ADD UNIQUE INDEX uq_pine_qnaire_id ( pine_qnaire_id );
    END IF;

  END //
DELIMITER ;

CALL patch_script();
DROP PROCEDURE IF EXISTS patch_script;


DELIMITER $$

DROP TRIGGER IF EXISTS script_BEFORE_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER script_BEFORE_INSERT BEFORE INSERT ON script FOR EACH ROW
BEGIN
  IF ( NEW.sid IS NULL AND NEW.pine_qnaire_id IS NULL ) or
     ( NEW.sid IS NOT NULL AND NEW.pine_qnaire_id IS NOT NULL ) THEN
    -- trigger column-not-null error
    SIGNAL SQLSTATE '23000'
    SET MESSAGE_TEXT = "Either column 'sid' or 'pine_qnaire_id' cannot be null",
    MYSQL_ERRNO = 1048;
  END IF;
END$$


DROP TRIGGER IF EXISTS script_BEFORE_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER script_BEFORE_UPDATE BEFORE UPDATE ON script FOR EACH ROW
BEGIN
  IF ( NEW.sid IS NULL AND NEW.pine_qnaire_id IS NULL ) or
     ( NEW.sid IS NOT NULL AND NEW.pine_qnaire_id IS NOT NULL ) THEN
    -- trigger column-not-null error
    SIGNAL SQLSTATE '23000'
    SET MESSAGE_TEXT = "Either column 'sid' or 'pine_qnaire_id' cannot be null",
    MYSQL_ERRNO = 1048;
  END IF;
END$$

DELIMITER ;

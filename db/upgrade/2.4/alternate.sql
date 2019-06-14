DROP PROCEDURE IF EXISTS patch_alternate;
DELIMITER //
CREATE PROCEDURE patch_alternate()
  BEGIN

    SELECT "Adding new email2 column to alternate table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "alternate"
    AND column_name = "email2";

    IF 0 = @total THEN
      ALTER TABLE alternate
      ADD COLUMN email2 VARCHAR(255) NULL DEFAULT NULL AFTER email_old;
    END IF;

    SELECT "Adding new email2_datetime column to alternate table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "alternate"
    AND column_name = "email2_datetime";

    IF 0 = @total THEN
      ALTER TABLE alternate
      ADD COLUMN email2_datetime DATETIME NULL DEFAULT NULL AFTER email2;
    END IF;

    SELECT "Adding new email2_old column to alternate table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "alternate"
    AND column_name = "email2_old";

    IF 0 = @total THEN
      ALTER TABLE alternate
      ADD COLUMN email2_old VARCHAR(255) NULL DEFAULT NULL AFTER email2_datetime;
    END IF;

  END //
DELIMITER ;

CALL patch_alternate();
DROP PROCEDURE IF EXISTS patch_alternate;

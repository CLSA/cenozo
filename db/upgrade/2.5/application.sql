DROP PROCEDURE IF EXISTS patch_application;
DELIMITER //
CREATE PROCEDURE patch_application()
  BEGIN

    SELECT "Adding new mail_name column to application table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "application"
    AND column_name = "mail_name";

    IF 0 = @total THEN
      ALTER TABLE application ADD COLUMN mail_name VARCHAR(255) NULL DEFAULT NULL;
    END IF;

    SELECT "Adding new mail_address column to application table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "application"
    AND column_name = "mail_address";

    IF 0 = @total THEN
      ALTER TABLE application ADD COLUMN mail_address VARCHAR(127) NULL DEFAULT NULL;
    END IF;

    SELECT "Adding new mail_header column to application table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "application"
    AND column_name = "mail_header";

    IF 0 = @total THEN
      ALTER TABLE application ADD COLUMN mail_header TEXT NULL DEFAULT NULL;
    END IF;

    SELECT "Adding new mail_footer column to application table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "application"
    AND column_name = "mail_footer";

    IF 0 = @total THEN
      ALTER TABLE application ADD COLUMN mail_footer TEXT NULL DEFAULT NULL;
    END IF;

  END //
DELIMITER ;

CALL patch_application();
DROP PROCEDURE IF EXISTS patch_application;

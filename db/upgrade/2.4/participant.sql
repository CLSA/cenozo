DROP PROCEDURE IF EXISTS patch_participant;
DELIMITER //
CREATE PROCEDURE patch_participant()
  BEGIN

    SELECT "Adding new current_sex column to participant table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "participant"
    AND column_name = "current_sex";

    IF 0 = @total THEN
      ALTER TABLE participant
      ADD COLUMN current_sex ENUM('male', 'female') NOT NULL AFTER sex;
      UPDATE participant SET current_sex = sex;
    END IF;

    SELECT "Adding new email2 column to participant table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "participant"
    AND column_name = "email2";

    IF 0 = @total THEN
      ALTER TABLE participant
      ADD COLUMN email2 VARCHAR(255) NULL DEFAULT NULL AFTER email_old;
    END IF;

    SELECT "Adding new email2_datetime column to participant table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "participant"
    AND column_name = "email2_datetime";

    IF 0 = @total THEN
      ALTER TABLE participant
      ADD COLUMN email2_datetime DATETIME NULL DEFAULT NULL AFTER email2;
    END IF;

    SELECT "Adding new email2_old column to participant table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "participant"
    AND column_name = "email2_old";

    IF 0 = @total THEN
      ALTER TABLE participant
      ADD COLUMN email2_old VARCHAR(255) NULL DEFAULT NULL AFTER email2_datetime;
    END IF;

    SELECT "Adding new date_of_death_ministry column to participant table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "participant"
    AND column_name = "date_of_death_ministry";

    IF 0 = @total THEN
      ALTER TABLE participant
      ADD COLUMN date_of_death_ministry TINYINT(1) NULL DEFAULT NULL AFTER date_of_death_accuracy;
    END IF;

    SELECT "Adding new withdraw_third_party column to participant table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "participant"
    AND column_name = "withdraw_third_party";

    IF 0 = @total THEN
      ALTER TABLE participant
      ADD COLUMN withdraw_third_party TINYINT(1) NULL DEFAULT NULL AFTER delink;
    END IF;

  END //
DELIMITER ;

CALL patch_participant();
DROP PROCEDURE IF EXISTS patch_participant;

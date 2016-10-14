DROP PROCEDURE IF EXISTS patch_alternate;
DELIMITER //
CREATE PROCEDURE patch_alternate()
  BEGIN

    SELECT "Dropping person_id column from alternate table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "alternate"
      AND COLUMN_NAME = "person_id" );
    IF @test = 1 THEN
      SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
      SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;

      -- drop column
      ALTER TABLE alternate
      DROP FOREIGN KEY fk_alternate_person,
      DROP INDEX fk_person_id,
      DROP INDEX uq_person_id,
      DROP COLUMN person_id;

      SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
      SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
    END IF;

    SELECT "Adding email columns to alternate table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "alternate"
      AND COLUMN_NAME = "email" );
    IF @test = 0 THEN
      ALTER TABLE alternate ADD COLUMN email VARCHAR(255) NULL AFTER association;
      ALTER TABLE alternate ADD COLUMN email_datetime DATETIME NULL AFTER email;
      ALTER TABLE alternate ADD COLUMN email_old VARCHAR(255) NULL AFTER email_datetime;
    END IF;

    SELECT "Adding global_note column to alternate table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "alternate"
      AND COLUMN_NAME = "global_note" );
    IF @test = 0 THEN
      ALTER TABLE alternate ADD COLUMN global_note TEXT NULL;
    END IF;

    SELECT "Allowing null values for alternate.association in alternate table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "alternate"
      AND COLUMN_NAME = "association"
      AND IS_NULLABLE = "NO" );
    IF @test = 1 THEN
      -- drop column
      ALTER TABLE alternate
      MODIFY COLUMN association VARCHAR(45) NULL;

      UPDATE alternate SET association = NULL WHERE association IN( "", "unknown", "blank", "na", "n/a", "none" );
    END IF;

  END //
DELIMITER ;

CALL patch_alternate();
DROP PROCEDURE IF EXISTS patch_alternate;

SELECT "Adding new triggers to alternate table" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS alternate_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER alternate_AFTER_INSERT AFTER INSERT ON alternate FOR EACH ROW
BEGIN
  CALL update_alternate_first_address( NEW.id );
END;$$

DELIMITER ;

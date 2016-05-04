DROP PROCEDURE IF EXISTS patch_participant;
DELIMITER //
CREATE PROCEDURE patch_participant()
  BEGIN

    SELECT "Changing email_do_not_contact to mass_email in participant table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant"
      AND COLUMN_NAME = "email_do_not_contact" );
    IF @test = 1 THEN
      -- add column
      ALTER TABLE participant
      ADD COLUMN mass_email TINYINT(1) NOT NULL DEFAULT 1
      AFTER email_do_not_contact;

      UPDATE participant SET mass_email = IF( email_do_not_contact, 0, 1 );

      ALTER TABLE participant DROP COLUMN email_do_not_contact;
    END IF;

    SELECT "Making language_id NOT NULL in participant table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant"
      AND COLUMN_NAME = "language_id"
      AND IS_NULLABLE = "YES" );
    IF @test = 1 THEN
      UPDATE participant, language
      SET language_id = language.id
      WHERE participant.language_id IS NULL
      AND language.code = "en";

      ALTER TABLE participant
      MODIFY language_id int(10) unsigned NOT NULL;
    END IF;

    SELECT "Renaming gender to sex in participant table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant"
      AND COLUMN_NAME = "gender" );
    IF @test = 1 THEN
      -- add column
      ALTER TABLE participant
      CHANGE gender sex ENUM('male','female') NOT NULL;
    END IF;

    SELECT "Dropping person_id column from participant table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant"
      AND COLUMN_NAME = "person_id" );
    IF @test = 1 THEN
      -- drop column
      ALTER TABLE participant
      DROP FOREIGN KEY fk_participant_person_id,
      DROP INDEX fk_person_id,
      DROP INDEX uq_person_id,
      DROP COLUMN person_id;
    END IF;

    SELECT "Adding note column to participant table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant"
      AND COLUMN_NAME = "note" );
    IF @test = 0 THEN
      ALTER TABLE participant ADD COLUMN note TEXT NULL DEFAULT NULL;
    END IF;

    SELECT "Adding availability_type_id column to participant table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant"
      AND COLUMN_NAME = "availability_type_id" );
    IF @test = 0 THEN
      ALTER TABLE participant ADD COLUMN availability_type_id INT UNSIGNED NULL DEFAULT NULL
      AFTER language_id;

      ALTER TABLE participant
      ADD INDEX fk_availability_type_id (availability_type_id ASC),
      ADD CONSTRAINT fk_participant_availability_type_id
        FOREIGN KEY (availability_type_id)
        REFERENCES availability_type (id)
        ON DELETE SET NULL
        ON UPDATE NO ACTION;

      -- now mine saturday-only availabilities from the old availability table
      CREATE TEMPORARY TABLE saturday
      SELECT participant_id FROM (
        SELECT participant_id, monday, tuesday, wednesday, thursday, friday, saturday
        FROM availability
        GROUP BY participant_id
        HAVING COUNT(*) = 1
      ) AS t
      WHERE monday = false
        AND tuesday = false
        AND wednesday = false
        AND thursday = false
        AND friday = false
        AND saturday = true;
      ALTER TABLE saturday ADD INDEX p ( participant_id );

      UPDATE participant
      JOIN saturday ON participant.id = saturday.participant_id
      SET availability_type_id = ( SELECT id FROM availability_type WHERE name = "saturdays" );
    END IF;

  END //
DELIMITER ;

CALL patch_participant();
DROP PROCEDURE IF EXISTS patch_participant;

SELECT "Adding new triggers to participant table" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS participant_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER participant_AFTER_INSERT AFTER INSERT ON participant FOR EACH ROW
BEGIN
  CALL update_participant_site_for_participant( NEW.id );
  CALL update_participant_first_address( NEW.id );
  CALL update_participant_primary_address( NEW.id );
  CALL update_participant_last_consents( NEW.id );
  CALL update_participant_last_written_consents( NEW.id );
  CALL update_participant_last_events( NEW.id );
END;$$

DELIMITER ;

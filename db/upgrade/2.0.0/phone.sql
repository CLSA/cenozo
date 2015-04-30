DROP PROCEDURE IF EXISTS patch_phone;
DELIMITER //
CREATE PROCEDURE patch_phone()
  BEGIN

    SELECT "Replacing person_id column with alternate_id and participant_id columns in phone table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "phone"
      AND COLUMN_NAME = "person_id" );
    IF @test = 1 THEN
      -- add columns
      ALTER TABLE phone
      DROP INDEX uq_person_id_rank,
      ADD COLUMN alternate_id INT UNSIGNED NULL AFTER person_id,
      ADD COLUMN participant_id INT UNSIGNED NULL AFTER alternate_id,
      ADD INDEX fk_alternate_id (alternate_id ASC),
      ADD INDEX fk_participant_id (participant_id ASC),
      ADD CONSTRAINT fk_phone_alternate_id
        FOREIGN KEY (alternate_id)
        REFERENCES alternate (id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION,
      ADD CONSTRAINT fk_phone_participant_id
        FOREIGN KEY (participant_id)
        REFERENCES participant (id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION;

      -- fill in new columns
      UPDATE phone
      LEFT JOIN participant USING( person_id )
      LEFT JOIN alternate USING( person_id )
      SET phone.alternate_id = alternate.id,
          phone.participant_id = participant.id;

      -- drop column
      ALTER TABLE phone
      DROP FOREIGN KEY fk_phone_person,
      DROP INDEX fk_person_id,
      DROP COLUMN person_id;

      ALTER TABLE phone
      ADD UNIQUE INDEX uq_alternate_id_participant_id_rank (alternate_id, participant_id, rank);
    END IF;

  END //
DELIMITER ;

CALL patch_phone();
DROP PROCEDURE IF EXISTS patch_phone;

SELECT "Adding new triggers to phone table" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS phone_BEFORE_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER phone_BEFORE_INSERT BEFORE INSERT ON phone FOR EACH ROW
BEGIN
  IF ( NEW.alternate_id IS NULL AND NEW.participant_id IS NULL ) or
     ( NEW.alternate_id IS NOT NULL AND NEW.participant_id IS NOT NULL ) THEN
    -- trigger column-not-null error
    SIGNAL SQLSTATE '23000'
    SET MESSAGE_TEXT = "Either column 'alternate_id' or 'participant_id' cannot be null",
    MYSQL_ERRNO = 1048;
  ELSE
    SET @test = (
      SELECT COUNT(*) FROM phone
      WHERE rank = NEW.rank
      AND alternate_id <=> NEW.alternate_id
      AND participant_id <=> NEW.participant_id
    );
    IF @test > 1 THEN
      -- trigger unique key conflict
      SET @sql = CONCAT(
        "Duplicate entry '",
        NEW.alternate_id, "-", NEW.participant_id, "-", NEW.rank,
        "' for key 'uq_alternate_id_participant_id_rank'"
      );
      SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = @sql, MYSQL_ERRNO = 1062;
    END IF;
  END IF;
END;$$


DROP TRIGGER IF EXISTS phone_BEFORE_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER phone_BEFORE_UPDATE BEFORE UPDATE ON phone FOR EACH ROW
BEGIN
  IF ( NEW.alternate_id IS NULL AND NEW.participant_id IS NULL ) or
     ( NEW.alternate_id IS NOT NULL AND NEW.participant_id IS NOT NULL ) THEN
    -- trigger column-not-null error
    SIGNAL SQLSTATE '23000'
    SET MESSAGE_TEXT = "Either column 'alternate_id' or 'participant_id' cannot be null",
    MYSQL_ERRNO = 1048;
  ELSE
    SET @test = (
      SELECT COUNT(*) FROM phone
      WHERE rank = NEW.rank
      AND alternate_id <=> NEW.alternate_id
      AND participant_id <=> NEW.participant_id
    );
    IF @test > 1 THEN
      -- trigger unique key conflict
      SET @sql = CONCAT(
        "Duplicate entry '",
        NEW.alternate_id, "-", NEW.participant_id, "-", NEW.rank,
        "' for key 'uq_alternate_id_participant_id_rank'"
      );
      SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = @sql, MYSQL_ERRNO = 1062;
    END IF;
  END IF;
END;$$

DELIMITER ;

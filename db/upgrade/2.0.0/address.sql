DROP PROCEDURE IF EXISTS patch_address;
DELIMITER //
CREATE PROCEDURE patch_address()
  BEGIN

    SELECT "Replacing person_id column with alternate_id and participant_id columns and adding international column to address table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "address"
      AND COLUMN_NAME = "person_id" );
    IF @test = 1 THEN
      -- add columns
      ALTER TABLE address
      DROP INDEX uq_person_id_rank,
      ADD COLUMN alternate_id INT UNSIGNED NULL AFTER person_id,
      ADD COLUMN participant_id INT UNSIGNED NULL AFTER alternate_id,
      ADD INDEX fk_alternate_id (alternate_id ASC),
      ADD INDEX fk_participant_id (participant_id ASC),
      ADD CONSTRAINT fk_address_alternate_id
        FOREIGN KEY (alternate_id)
        REFERENCES alternate (id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION,
      ADD CONSTRAINT fk_address_participant_id
        FOREIGN KEY (participant_id)
        REFERENCES participant (id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION;

      -- fill in new columns
      UPDATE address
      LEFT JOIN participant USING( person_id )
      LEFT JOIN alternate USING( person_id )
      SET address.alternate_id = alternate.id,
          address.participant_id = participant.id;

      -- drop column
      ALTER TABLE address
      DROP FOREIGN KEY fk_address_person,
      DROP INDEX fk_person_id,
      DROP COLUMN person_id;

      ALTER TABLE address
      ADD UNIQUE INDEX uq_alternate_id_participant_id_rank (alternate_id, participant_id, rank);
    END IF;

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "address"
      AND COLUMN_NAME = "international" );
    IF @test = 0 THEN
      -- add columns
      ALTER TABLE address
      ADD COLUMN international TINYINT(1) NOT NULL DEFAULT 0 AFTER rank;
    END IF;

    SET @test = (
      SELECT 'NO' = IS_NULLABLE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "address"
      AND COLUMN_NAME = "region_id" );
    IF @test = 1 THEN
      -- make column nullable
      ALTER TABLE address MODIFY region_id INT UNSIGNED NULL;
    END IF;

    SET @test = (
      SELECT 'NO' = IS_NULLABLE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "address"
      AND COLUMN_NAME = "postcode" );
    IF @test = 1 THEN
      -- make column nullable
      ALTER TABLE address MODIFY postcode VARCHAR(10) NULL;
    END IF;

  END //
DELIMITER ;

CALL patch_address();
DROP PROCEDURE IF EXISTS patch_address;

SELECT "Adding new triggers to address table" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS address_BEFORE_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER address_BEFORE_INSERT BEFORE INSERT ON address FOR EACH ROW
BEGIN
  IF ( NEW.alternate_id IS NULL AND NEW.participant_id IS NULL ) or
     ( NEW.alternate_id IS NOT NULL AND NEW.participant_id IS NOT NULL ) THEN
    -- trigger column-not-null error
    SIGNAL SQLSTATE '23000'
    SET MESSAGE_TEXT = "Either column 'alternate_id' or 'participant_id' cannot be null",
    MYSQL_ERRNO = 1048;
  ELSE
    SET @test = (
      SELECT COUNT(*) FROM address
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


DROP TRIGGER IF EXISTS address_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER address_AFTER_INSERT AFTER INSERT ON address FOR EACH ROW
BEGIN
  IF NEW.alternate_id IS NOT NULL THEN
    CALL update_alternate_first_address( NEW.alternate_id );
  ELSE
    CALL update_participant_first_address( NEW.participant_id );
    CALL update_participant_primary_address( NEW.participant_id );
  END IF;
END;$$


DROP TRIGGER IF EXISTS address_BEFORE_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER address_BEFORE_UPDATE BEFORE UPDATE ON address FOR EACH ROW
BEGIN
  IF ( NEW.alternate_id IS NULL AND NEW.participant_id IS NULL ) or
     ( NEW.alternate_id IS NOT NULL AND NEW.participant_id IS NOT NULL ) THEN
    -- trigger column-not-null error
    SIGNAL SQLSTATE '23000'
    SET MESSAGE_TEXT = "Either column 'alternate_id' or 'participant_id' cannot be null",
    MYSQL_ERRNO = 1048;
  ELSE
    SET @test = (
      SELECT COUNT(*) FROM address
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


DROP TRIGGER IF EXISTS address_AFTER_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER address_AFTER_UPDATE AFTER UPDATE ON address FOR EACH ROW
BEGIN
  IF NEW.alternate_id IS NOT NULL THEN
    CALL update_alternate_first_address( NEW.alternate_id );
  ELSE
    CALL update_participant_first_address( NEW.participant_id );
    CALL update_participant_primary_address( NEW.participant_id );
  END IF;
END;$$


DROP TRIGGER IF EXISTS address_BEFORE_DELETE $$
CREATE DEFINER = CURRENT_USER TRIGGER address_BEFORE_DELETE BEFORE DELETE ON address FOR EACH ROW
BEGIN
  IF OLD.alternate_id IS NOT NULL THEN
    DELETE FROM alternate_first_address WHERE alternate_id = OLD.alternate_id;
  ELSE
    DELETE FROM participant_first_address WHERE participant_id = OLD.participant_id;
    DELETE FROM participant_primary_address WHERE participant_id = OLD.participant_id;
  END IF;
END;$$


DROP TRIGGER IF EXISTS address_AFTER_DELETE $$
CREATE DEFINER = CURRENT_USER TRIGGER address_AFTER_DELETE AFTER DELETE ON address FOR EACH ROW
BEGIN
  IF OLD.alternate_id IS NOT NULL THEN
    CALL update_alternate_first_address( OLD.alternate_id );
  ELSE
    CALL update_participant_first_address( OLD.participant_id );
    CALL update_participant_primary_address( OLD.participant_id );
  END IF;
END;$$

DELIMITER ;

SELECT "Fixing bugs in address triggers" AS "";

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
    IF @test > 0 THEN
      -- trigger unique key conflict
      SET @sql = CONCAT(
        "Duplicate entry '",
        IFNULL( NEW.alternate_id, "NULL" ), "-", IFNULL( NEW.participant_id, "NULL" ), "-", NEW.rank,
        "' for key 'uq_alternate_id_participant_id_rank'"
      );
      SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = @sql, MYSQL_ERRNO = 1062;
    END IF;
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
      AND address.id != NEW.id
    );
    IF @test > 0 THEN
      -- trigger unique key conflict
      SET @sql = CONCAT(
        "Duplicate entry '",
        IFNULL( NEW.alternate_id, "NULL" ), "-", IFNULL( NEW.participant_id, "NULL" ), "-", NEW.rank,
        "' for key 'uq_alternate_id_participant_id_rank'"
      );
      SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = @sql, MYSQL_ERRNO = 1062;
    END IF;
  END IF;
END;$$

DELIMITER ;

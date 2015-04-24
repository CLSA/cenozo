SELECT "Adding new triggers to address table" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS address_AFTER_INSERT $$
CREATE TRIGGER address_AFTER_INSERT AFTER INSERT ON address FOR EACH ROW
BEGIN

  CALL update_person_first_address( NEW.person_id );
  SET @participant_id = (
    SELECT id FROM participant
    WHERE person_id = NEW.person_id
  );
  IF @participant_id THEN
    CALL update_participant_primary_address( @participant_id );
  END IF;

END;$$

DROP TRIGGER IF EXISTS address_AFTER_UPDATE $$
CREATE TRIGGER address_AFTER_UPDATE AFTER UPDATE ON address FOR EACH ROW
BEGIN

  CALL update_person_first_address( NEW.person_id );
  SET @participant_id = (
    SELECT id FROM participant
    WHERE person_id = NEW.person_id
  );
  IF @participant_id THEN
    CALL update_participant_primary_address( @participant_id );
  END IF;

END;$$

DROP TRIGGER IF EXISTS address_BEFORE_DELETE $$
CREATE TRIGGER address_BEFORE_DELETE BEFORE DELETE ON address FOR EACH ROW
BEGIN

  SET @participant_id = (
    SELECT id FROM participant
    WHERE person_id = OLD.person_id
  );
  IF @participant_id THEN
    DELETE FROM participant_primary_address
    WHERE participant_id = @participant_id;
  END IF;

  DELETE FROM person_first_address
  WHERE person_id = OLD.person_id;

END;$$

DROP TRIGGER IF EXISTS address_AFTER_DELETE $$
CREATE TRIGGER address_AFTER_DELETE AFTER DELETE ON address FOR EACH ROW
BEGIN

  CALL update_person_first_address( OLD.person_id );
  SET @participant_id = (
    SELECT id FROM participant
    WHERE person_id = OLD.person_id
  );
  IF @participant_id THEN
    CALL update_participant_primary_address( @participant_id );
  END IF;

END;$$

DELIMITER ;

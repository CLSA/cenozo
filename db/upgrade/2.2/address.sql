SELECT "Replacing existing triggers in address table" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS address_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER address_AFTER_INSERT AFTER INSERT ON address FOR EACH ROW
BEGIN
  IF NEW.alternate_id IS NOT NULL THEN
    CALL update_alternate_first_address( NEW.alternate_id );
  ELSE
    CALL update_participant_first_address( NEW.participant_id );
    CALL update_participant_primary_address( NEW.participant_id );
    CALL contact_changed( NEW.participant_id );
  END IF;
END$$

DROP TRIGGER IF EXISTS address_AFTER_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER address_AFTER_UPDATE AFTER UPDATE ON address FOR EACH ROW
BEGIN
  IF NEW.alternate_id IS NOT NULL THEN
    CALL update_alternate_first_address( NEW.alternate_id );
  ELSE
    CALL update_participant_first_address( NEW.participant_id );
    CALL update_participant_primary_address( NEW.participant_id );
    CALL contact_changed( NEW.participant_id );
  END IF;
END$$

DROP TRIGGER IF EXISTS address_AFTER_DELETE $$
CREATE DEFINER = CURRENT_USER TRIGGER address_AFTER_DELETE AFTER DELETE ON address FOR EACH ROW
BEGIN
  IF OLD.alternate_id IS NOT NULL THEN
    CALL update_alternate_first_address( OLD.alternate_id );
  ELSE
    CALL update_participant_first_address( OLD.participant_id );
    CALL update_participant_primary_address( OLD.participant_id );
    CALL contact_changed( OLD.participant_id );
  END IF;
END$$

DELIMITER ;

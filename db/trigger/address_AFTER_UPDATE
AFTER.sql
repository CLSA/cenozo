CREATE TRIGGER address_AFTER_UPDATE
AFTER UPDATE ON address FOR EACH ROW
BEGIN
  IF NEW.alternate_id IS NOT NULL THEN
    CALL update_alternate_first_address( NEW.alternate_id );
  ELSE
    CALL update_participant_first_address( NEW.participant_id );
    CALL update_participant_primary_address( NEW.participant_id );
    CALL contact_changed( NEW.participant_id );
  END IF;
END$$
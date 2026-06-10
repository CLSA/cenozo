CREATE TRIGGER address_AFTER_DELETE AFTER DELETE ON address FOR EACH ROW
BEGIN
  IF OLD.alternate_id IS NOT NULL THEN
    CALL update_alternate_first_address( OLD.alternate_id );
  ELSE
    CALL update_participant_first_address( OLD.participant_id );
    CALL update_participant_primary_address( OLD.participant_id );
    CALL contact_changed( OLD.participant_id );
  END IF;
END ;;
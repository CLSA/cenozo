CREATE TRIGGER phone_AFTER_DELETE AFTER DELETE ON phone FOR EACH ROW
BEGIN
  IF OLD.participant_id IS NOT NULL THEN
    CALL contact_changed( OLD.participant_id );
  END IF;
END ;;
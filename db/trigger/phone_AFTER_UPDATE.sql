CREATE TRIGGER phone_AFTER_UPDATE AFTER UPDATE ON phone FOR EACH ROW
BEGIN
  IF NEW.participant_id IS NOT NULL THEN
    CALL contact_changed( NEW.participant_id );
  END IF;
END ;;

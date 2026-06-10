CREATE TRIGGER phone_AFTER_INSERT AFTER INSERT ON phone FOR EACH ROW
BEGIN
  IF NEW.participant_id IS NOT NULL THEN
    CALL contact_changed( NEW.participant_id );
  END IF;
END ;;
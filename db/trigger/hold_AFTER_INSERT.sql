CREATE TRIGGER hold_AFTER_INSERT AFTER INSERT ON hold FOR EACH ROW
BEGIN
  CALL update_participant_last_hold( NEW.participant_id );
END ;;

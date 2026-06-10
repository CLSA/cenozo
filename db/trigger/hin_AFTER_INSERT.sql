CREATE TRIGGER hin_AFTER_INSERT AFTER INSERT ON hin FOR EACH ROW
BEGIN
  CALL update_participant_last_hin( NEW.participant_id );
END ;;
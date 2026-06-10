CREATE TRIGGER hin_AFTER_DELETE AFTER DELETE ON hin FOR EACH ROW
BEGIN
  CALL update_participant_last_hin( OLD.participant_id );
END ;;
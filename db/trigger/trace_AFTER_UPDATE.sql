CREATE TRIGGER trace_AFTER_UPDATE AFTER UPDATE ON trace FOR EACH ROW
BEGIN
  CALL update_participant_last_trace( NEW.participant_id );
END ;;
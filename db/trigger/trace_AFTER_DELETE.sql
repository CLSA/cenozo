CREATE TRIGGER trace_AFTER_DELETE AFTER DELETE ON trace FOR EACH ROW
BEGIN
  CALL update_participant_last_trace( OLD.participant_id );
END ;;
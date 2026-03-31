CREATE TRIGGER trace_AFTER_INSERT
AFTER INSERT ON trace FOR EACH ROW
BEGIN
  CALL update_participant_last_trace( NEW.participant_id );
END$$
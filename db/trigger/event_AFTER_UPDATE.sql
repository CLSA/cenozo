CREATE TRIGGER event_AFTER_UPDATE
AFTER UPDATE ON event FOR EACH ROW
BEGIN
  CALL update_participant_last_event( NEW.participant_id, NEW.event_type_id );
END$$
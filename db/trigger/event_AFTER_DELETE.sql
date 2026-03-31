CREATE TRIGGER event_AFTER_DELETE
AFTER DELETE ON event FOR EACH ROW
BEGIN
  CALL update_participant_last_event( OLD.participant_id, OLD.event_type_id );
END$$
CREATE TRIGGER hold_AFTER_DELETE
AFTER DELETE ON hold FOR EACH ROW
BEGIN
  CALL update_participant_last_hold( OLD.participant_id );
END$$
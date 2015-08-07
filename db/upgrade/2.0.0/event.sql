SELECT "Adding new triggers to event table" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS event_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER event_AFTER_INSERT AFTER INSERT ON event FOR EACH ROW
BEGIN
  CALL update_participant_last_event( NEW.participant_id, NEW.event_type_id );
END;$$

DROP TRIGGER IF EXISTS event_AFTER_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER event_AFTER_UPDATE AFTER UPDATE ON event FOR EACH ROW
BEGIN
  CALL update_participant_last_event( NEW.participant_id, NEW.event_type_id );
END;$$

DROP TRIGGER IF EXISTS event_AFTER_DELETE $$
CREATE DEFINER = CURRENT_USER TRIGGER event_AFTER_DELETE AFTER DELETE ON event FOR EACH ROW
BEGIN
  CALL update_participant_last_event( OLD.participant_id, OLD.event_type_id );
END;$$

DELIMITER ;

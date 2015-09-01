SELECT "Adding new triggers to event_type table" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS event_type_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER event_type_AFTER_INSERT AFTER INSERT ON event_type FOR EACH ROW
BEGIN
  INSERT INTO participant_last_event( participant_id, event_type_id, event_id )
  SELECT participant.id, NEW.id, NULL 
  FROM participant;
END;$$

DELIMITER ;

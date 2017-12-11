DELIMITER $$
    
DROP TRIGGER IF EXISTS trace_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER trace_AFTER_INSERT AFTER INSERT ON trace FOR EACH ROW
BEGIN
  CALL remove_duplicate_trace( NEW.participant_id );
  CALL update_participant_last_trace( NEW.participant_id );
END$$

DROP TRIGGER IF EXISTS trace_AFTER_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER trace_AFTER_UPDATE AFTER UPDATE ON trace FOR EACH ROW
BEGIN
  CALL update_participant_last_trace( NEW.participant_id );
END$$

DROP TRIGGER IF EXISTS trace_AFTER_DELETE $$
CREATE DEFINER = CURRENT_USER TRIGGER trace_AFTER_DELETE AFTER DELETE ON trace FOR EACH ROW
BEGIN
  CALL update_participant_last_trace( OLD.participant_id );
END$$

DELIMITER ;

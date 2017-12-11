DELIMITER $$
    
DROP TRIGGER IF EXISTS proxy_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER proxy_AFTER_INSERT AFTER INSERT ON proxy FOR EACH ROW
BEGIN
  CALL remove_duplicate_proxy( NEW.participant_id );
  CALL update_participant_last_proxy( NEW.participant_id );
END$$

DROP TRIGGER IF EXISTS proxy_AFTER_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER proxy_AFTER_UPDATE AFTER UPDATE ON proxy FOR EACH ROW
BEGIN
  CALL update_participant_last_proxy( NEW.participant_id );
END$$

DROP TRIGGER IF EXISTS proxy_AFTER_DELETE $$
CREATE DEFINER = CURRENT_USER TRIGGER proxy_AFTER_DELETE AFTER DELETE ON proxy FOR EACH ROW
BEGIN
  CALL update_participant_last_proxy( OLD.participant_id );
END$$

DELIMITER ;
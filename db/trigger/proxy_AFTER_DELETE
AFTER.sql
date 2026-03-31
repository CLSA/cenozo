CREATE TRIGGER proxy_AFTER_DELETE
AFTER DELETE ON proxy FOR EACH ROW
BEGIN
  CALL update_participant_last_proxy( OLD.participant_id );
END$$
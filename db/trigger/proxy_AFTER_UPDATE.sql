CREATE TRIGGER proxy_AFTER_UPDATE AFTER UPDATE ON proxy FOR EACH ROW
BEGIN
  CALL update_participant_last_proxy( NEW.participant_id );
END ;;

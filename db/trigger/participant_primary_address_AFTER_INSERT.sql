CREATE TRIGGER participant_primary_address_AFTER_INSERT AFTER INSERT ON participant_primary_address FOR EACH ROW
BEGIN
  CALL update_participant_site_for_participant( NEW.participant_id );
END ;;

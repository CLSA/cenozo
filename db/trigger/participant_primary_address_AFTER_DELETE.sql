CREATE TRIGGER participant_primary_address_AFTER_DELETE AFTER DELETE ON participant_primary_address FOR EACH ROW
BEGIN
  CALL update_participant_site_for_participant( OLD.participant_id );
END ;;
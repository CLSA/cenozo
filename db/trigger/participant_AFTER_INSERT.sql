CREATE TRIGGER participant_AFTER_INSERT AFTER INSERT ON participant FOR EACH ROW
BEGIN
  CALL update_participant_site_for_participant( NEW.id );
  CALL update_participant_first_address( NEW.id );
  CALL update_participant_primary_address( NEW.id );
  CALL update_participant_last_consents( NEW.id );
  CALL update_participant_last_written_consents( NEW.id );
  CALL update_participant_last_events( NEW.id );
  CALL update_participant_last_hin( NEW.id );
  CALL update_participant_last_hold( NEW.id );
  CALL update_participant_last_proxy( NEW.id );
  CALL update_participant_last_trace( NEW.id );
END ;;

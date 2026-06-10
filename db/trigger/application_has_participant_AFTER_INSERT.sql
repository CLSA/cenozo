CREATE TRIGGER application_has_participant_AFTER_INSERT AFTER INSERT ON application_has_participant FOR EACH ROW
BEGIN

  IF( NEW.preferred_site_id IS NOT NULL ) THEN
    CALL update_participant_site_for_participant( NEW.participant_id );
  END IF;

END ;;
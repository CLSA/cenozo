CREATE TRIGGER application_has_participant_AFTER_UPDATE
AFTER UPDATE ON application_has_participant FOR EACH ROW
BEGIN
  IF( NOT NEW.preferred_site_id <=> OLD.preferred_site_id ) THEN
    CALL update_participant_site_for_participant( NEW.participant_id );
  END IF;
END$$
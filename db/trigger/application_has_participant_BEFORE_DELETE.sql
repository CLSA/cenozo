CREATE TRIGGER application_has_participant_BEFORE_DELETE
BEFORE DELETE ON application_has_participant
FOR EACH ROW
BEGIN

  IF( OLD.preferred_site_id ) THEN
    DELETE FROM participant_site
    WHERE participant_id = OLD.participant_id;
    CALL update_participant_site_for_participant( OLD.participant_id );
  END IF;

END ;;
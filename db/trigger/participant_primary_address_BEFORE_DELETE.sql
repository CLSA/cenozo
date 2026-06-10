CREATE TRIGGER participant_primary_address_BEFORE_DELETE BEFORE DELETE ON participant_primary_address FOR EACH ROW
BEGIN
  DELETE FROM participant_site
  WHERE participant_id = OLD.participant_id;
END ;;
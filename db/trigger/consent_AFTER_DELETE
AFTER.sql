CREATE TRIGGER consent_AFTER_DELETE
AFTER DELETE ON consent FOR EACH ROW
BEGIN
  CALL update_participant_last_consent( OLD.participant_id, OLD.consent_type_id );
  CALL update_participant_last_written_consent( OLD.participant_id, OLD.consent_type_id );
  DELETE FROM form_association WHERE subject = "consent" AND record_id = OLD.id;
END$$
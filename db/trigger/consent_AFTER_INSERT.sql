CREATE TRIGGER consent_AFTER_INSERT AFTER INSERT ON consent FOR EACH ROW
BEGIN
  CALL update_participant_last_consent( NEW.participant_id, NEW.consent_type_id );
  CALL update_participant_last_written_consent( NEW.participant_id, NEW.consent_type_id );
END ;;
CREATE TRIGGER alternate_consent_AFTER_INSERT AFTER INSERT ON alternate_consent FOR EACH ROW
BEGIN
  CALL update_alternate_last_alternate_consent( NEW.alternate_id, NEW.alternate_consent_type_id );
  CALL update_alternate_last_written_alternate_consent( NEW.alternate_id, NEW.alternate_consent_type_id );
END ;;
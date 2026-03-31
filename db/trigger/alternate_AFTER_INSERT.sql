CREATE TRIGGER alternate_AFTER_INSERT
AFTER INSERT ON alternate FOR EACH ROW
BEGIN
  CALL update_alternate_first_address( NEW.id );
  CALL update_alternate_last_alternate_consents( NEW.id );
  CALL update_alternate_last_written_alternate_consents( NEW.id );
END$$
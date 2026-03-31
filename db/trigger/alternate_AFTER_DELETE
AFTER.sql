CREATE TRIGGER alternate_AFTER_DELETE
AFTER DELETE ON alternate FOR EACH ROW
BEGIN
  DELETE FROM form_association WHERE subject = "alternate" AND record_id = OLD.id;
END$$
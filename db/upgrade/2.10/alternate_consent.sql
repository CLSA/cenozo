SELECT "Modifying alternate_consent after delete trigger" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS alternate_consent_AFTER_DELETE;
CREATE DEFINER=CURRENT_USER TRIGGER alternate_consent_AFTER_DELETE AFTER DELETE ON alternate_consent FOR EACH ROW
BEGIN
  CALL update_alternate_last_alternate_consent( OLD.alternate_id, OLD.alternate_consent_type_id );
  CALL update_alternate_last_written_alternate_consent( OLD.alternate_id, OLD.alternate_consent_type_id );
  DELETE FROM form_association WHERE subject = "alternate_consent" AND record_id = OLD.id;
END$$

DELIMITER ;

SELECT "Adding new triggers to consent table" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS consent_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER consent_AFTER_INSERT AFTER INSERT ON consent FOR EACH ROW
BEGIN
  CALL update_participant_last_consent( NEW.participant_id );
  CALL update_participant_last_written_consent( NEW.participant_id );
END;$$


DROP TRIGGER IF EXISTS consent_AFTER_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER consent_AFTER_UPDATE AFTER UPDATE ON consent FOR EACH ROW
BEGIN
  CALL update_participant_last_consent( NEW.participant_id );
  CALL update_participant_last_written_consent( NEW.participant_id );
END;$$


DROP TRIGGER IF EXISTS consent_BEFORE_DELETE $$
CREATE DEFINER = CURRENT_USER TRIGGER consent_BEFORE_DELETE BEFORE DELETE ON consent FOR EACH ROW
BEGIN
  CALL update_participant_last_consent( OLD.participant_id );
  CALL update_participant_last_written_consent( OLD.participant_id );
END;$$


DELIMITER ;

DROP PROCEDURE IF EXISTS patch_consent;
  DELIMITER //
  CREATE PROCEDURE patch_consent()
  BEGIN

    SELECT "Modifiying constraint delete rules in consent table" AS "";

    SET @test = (
      SELECT DELETE_RULE
      FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = "consent"
      AND REFERENCED_TABLE_NAME = "participant" );
    IF @test = "NO ACTION" THEN
      ALTER TABLE consent
      DROP FOREIGN KEY fk_consent_participant_id;

      ALTER TABLE consent
      ADD CONSTRAINT fk_consent_participant_id
      FOREIGN KEY (participant_id)
      REFERENCES participant (id)
      ON DELETE CASCADE
      ON UPDATE NO ACTION;
    END IF;

    SELECT "Adding consent_type_id column to consent table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "consent"
      AND COLUMN_NAME = "consent_type_id" );
    IF @test = 0 THEN
      ALTER TABLE consent
      ADD column consent_type_id INT UNSIGNED NOT NULL
      AFTER participant_id;

      UPDATE consent, consent_type
      SET consent_type_id = consent_type.id
      WHERE consent_type.name = "participation";

      ALTER TABLE consent
      ADD INDEX fk_consent_type_id (consent_type_id ASC),
      ADD CONSTRAINT fk_consent_consent_type_id
      FOREIGN KEY (consent_type_id)
      REFERENCES consent_type (id)
      ON DELETE CASCADE
      ON UPDATE NO ACTION;
    END IF;

    SELECT "Changing date column to datetime in consent table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "consent"
      AND COLUMN_NAME = "date" );
    IF @test = 1 THEN
      ALTER TABLE consent CHANGE date datetime DATETIME NOT NULL;
      UPDATE consent SET datetime = CONVERT_TZ( datetime + INTERVAL 12 HOUR, "Canada/Eastern", "UTC" );
    END IF;

    SELECT "Transferring hin consent information to consent table" AS "";
    SET @test = (
      SELECT COUNT(*)
      FROM consent
      JOIN consent_type ON consent.consent_type_id = consent_type.id
      WHERE consent_type.name LIKE "HIN %" );
    IF @test = 0 THEN
      INSERT INTO consent( participant_id, consent_type_id, accept, written, datetime, note )
      SELECT participant_id, consent_type.id, access, false, hin.update_timestamp,
             "Transferred from old HIN information."
      FROM hin, consent_type
      WHERE hin.access IS NOT NULL
      AND consent_type.name = "HIN access";

      INSERT INTO consent( participant_id, consent_type_id, accept, written, datetime, note )
      SELECT participant_id, consent_type.id, future_access, false, hin.update_timestamp,
             "Transferred from old HIN information."
      FROM hin, consent_type
      WHERE hin.future_access IS NOT NULL
      AND consent_type.name = "HIN future access";
    END IF;

  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL patch_consent();
DROP PROCEDURE IF EXISTS patch_consent;

SELECT "Adding new triggers to consent table" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS consent_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER consent_AFTER_INSERT AFTER INSERT ON consent FOR EACH ROW
BEGIN
  CALL update_participant_last_consent( NEW.participant_id, NEW.consent_type_id );
  CALL update_participant_last_written_consent( NEW.participant_id, NEW.consent_type_id );
END;$$


DROP TRIGGER IF EXISTS consent_AFTER_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER consent_AFTER_UPDATE AFTER UPDATE ON consent FOR EACH ROW
BEGIN
  CALL update_participant_last_consent( NEW.participant_id, NEW.consent_type_id );
  CALL update_participant_last_written_consent( NEW.participant_id, NEW.consent_type_id );
END;$$


DROP TRIGGER IF EXISTS consent_AFTER_DELETE $$
CREATE DEFINER = CURRENT_USER TRIGGER consent_AFTER_DELETE AFTER DELETE ON consent FOR EACH ROW
BEGIN
  CALL update_participant_last_consent( OLD.participant_id, OLD.consent_type_id );
  CALL update_participant_last_written_consent( OLD.participant_id, OLD.consent_type_id );
END;$$


DELIMITER ;

DROP PROCEDURE IF EXISTS patch_event;
  DELIMITER //
  CREATE PROCEDURE patch_event()
  BEGIN

    SELECT "Modifiying constraint delete rules in event table" AS "";

    SET @test = (
      SELECT DELETE_RULE
      FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = "event"
      AND REFERENCED_TABLE_NAME = "participant" );
    IF @test = "NO ACTION" THEN
      ALTER TABLE event
      DROP FOREIGN KEY fk_event_participant_id;

      ALTER TABLE event
      ADD CONSTRAINT fk_event_participant_id
      FOREIGN KEY (participant_id)
      REFERENCES participant (id)
      ON DELETE CASCADE
      ON UPDATE NO ACTION;
    END IF;

    SET @test = (
      SELECT DELETE_RULE
      FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = "event"
      AND REFERENCED_TABLE_NAME = "event_type" );
    IF @test = "NO ACTION" THEN
      ALTER TABLE event
      DROP FOREIGN KEY fk_event_event_type_id;

      ALTER TABLE event
      ADD CONSTRAINT fk_event_event_type_id
      FOREIGN KEY (event_type_id)
      REFERENCES event_type (id)
      ON DELETE CASCADE
      ON UPDATE NO ACTION;
    END IF;

  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL patch_event();
DROP PROCEDURE IF EXISTS patch_event;

SELECT "Adding new triggers to event table" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS event_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER event_AFTER_INSERT AFTER INSERT ON event FOR EACH ROW
BEGIN
  CALL update_participant_last_event( NEW.participant_id, NEW.event_type_id );
END;$$

DROP TRIGGER IF EXISTS event_AFTER_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER event_AFTER_UPDATE AFTER UPDATE ON event FOR EACH ROW
BEGIN
  CALL update_participant_last_event( NEW.participant_id, NEW.event_type_id );
END;$$

DROP TRIGGER IF EXISTS event_AFTER_DELETE $$
CREATE DEFINER = CURRENT_USER TRIGGER event_AFTER_DELETE AFTER DELETE ON event FOR EACH ROW
BEGIN
  CALL update_participant_last_event( OLD.participant_id, OLD.event_type_id );
END;$$

DELIMITER ;

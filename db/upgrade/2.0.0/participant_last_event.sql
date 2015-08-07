DROP PROCEDURE IF EXISTS patch_participant_last_event;
DELIMITER //
CREATE PROCEDURE patch_participant_last_event()
  BEGIN

    SELECT "Adding new participant_last_event caching table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant_last_event" );
    IF @test = 0 THEN

      CREATE TABLE IF NOT EXISTS participant_last_event (
        participant_id INT UNSIGNED NOT NULL,
        event_type_id INT UNSIGNED NOT NULL,
        event_id INT UNSIGNED NULL,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        PRIMARY KEY (participant_id, event_type_id),
        INDEX fk_event_type_id (event_type_id ASC),
        INDEX fk_event_id (event_id ASC),
        CONSTRAINT fk_participant_last_event_participant_id
          FOREIGN KEY (participant_id)
          REFERENCES participant (id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_participant_last_event_event_type_id
          FOREIGN KEY (event_type_id)
          REFERENCES event_type (id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_participant_last_event_event_id
          FOREIGN KEY (event_id)
          REFERENCES event (id)
          ON DELETE SET NULL 
          ON UPDATE NO ACTION)
      ENGINE = InnoDB;

      SELECT "Populating participant_last_event table" AS "";

      REPLACE INTO participant_last_event( participant_id, event_type_id, event_id )
      SELECT participant.id, event_type.id, event.id
      FROM participant
      CROSS JOIN event_type
      LEFT JOIN event ON participant.id = event.participant_id
      AND event_type.id = event.event_type_id
      AND event.datetime <=> (
        SELECT MAX( datetime )
        FROM event
        WHERE participant.id = event.participant_id
        AND event_type.id = event.event_type_id
        GROUP BY event.participant_id, event.event_type_id
        LIMIT 1
      );

    END IF;

  END //
DELIMITER ;

CALL patch_participant_last_event();
DROP PROCEDURE IF EXISTS patch_participant_last_event;

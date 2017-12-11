DROP PROCEDURE IF EXISTS patch_participant_last_trace;
DELIMITER //
CREATE PROCEDURE patch_participant_last_trace()
  BEGIN

    SELECT "Creating new participant_last_trace table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant_last_trace" );
    IF @test = 0 THEN

      CREATE TABLE IF NOT EXISTS participant_last_trace (
        participant_id INT UNSIGNED NOT NULL,
        trace_id INT UNSIGNED NULL,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        PRIMARY KEY (participant_id),
        INDEX fk_trace_id (trace_id ASC),
        CONSTRAINT fk_participant_last_trace_participant_id
          FOREIGN KEY (participant_id)
          REFERENCES participant (id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_participant_last_trace_trace_id
          FOREIGN KEY (trace_id)
          REFERENCES trace (id)
          ON DELETE SET NULL
          ON UPDATE CASCADE)
      ENGINE = InnoDB;

      SELECT "Populating participant_last_trace table" AS "";

      REPLACE INTO participant_last_trace( participant_id, trace_id )
      SELECT participant.id, trace.id
      FROM participant
      LEFT JOIN trace ON participant.id = trace.participant_id
      AND trace.datetime <=> (
        SELECT MAX( datetime )
        FROM trace
        WHERE participant.id = trace.participant_id
        GROUP BY trace.participant_id
        LIMIT 1
      );

    END IF;

  END //
DELIMITER ;

CALL patch_participant_last_trace();
DROP PROCEDURE IF EXISTS patch_participant_last_trace;

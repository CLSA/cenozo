DROP PROCEDURE IF EXISTS patch_participant_last_hold;
DELIMITER //
CREATE PROCEDURE patch_participant_last_hold()
  BEGIN

    SELECT "Creating new participant_last_hold table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant_last_hold" );
    IF @test = 0 THEN

      CREATE TABLE IF NOT EXISTS participant_last_hold (
        participant_id INT UNSIGNED NOT NULL,
        hold_id INT UNSIGNED NOT NULL,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        PRIMARY KEY (participant_id),
        INDEX fk_hold_id (hold_id ASC),
        CONSTRAINT fk_participant_last_hold_participant_id
          FOREIGN KEY (participant_id)
          REFERENCES participant (id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_participant_last_hold_hold_id
          FOREIGN KEY (hold_id)
          REFERENCES hold (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION)
      ENGINE = InnoDB;

      SELECT "Populating participant_last_hold table" AS "";

      REPLACE INTO participant_last_hold( participant_id, hold_id )
      SELECT participant.id, hold.id
      FROM participant
      LEFT JOIN hold ON participant.id = hold.participant_id
      AND hold.datetime <=> (
        SELECT MAX( datetime )
        FROM hold
        WHERE participant.id = hold.participant_id
        GROUP BY hold.participant_id
        LIMIT 1
      );

    END IF;

  END //
DELIMITER ;

CALL patch_participant_last_hold();
DROP PROCEDURE IF EXISTS patch_participant_last_hold;

DROP PROCEDURE IF EXISTS patch_participant_last_hin;
DELIMITER //
CREATE PROCEDURE patch_participant_last_hin()
  BEGIN

    SELECT "Adding new participant_last_hin caching table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant_last_hin" );
    IF @test = 0 THEN

      CREATE TABLE IF NOT EXISTS participant_last_hin (
        participant_id INT UNSIGNED NOT NULL,
        hin_id INT UNSIGNED NULL,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        PRIMARY KEY (participant_id),
        INDEX fk_hin_id (hin_id ASC),
        CONSTRAINT fk_participant_last_hin_participant_id
          FOREIGN KEY (participant_id)
          REFERENCES participant (id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_participant_last_hin_hin_id
          FOREIGN KEY (hin_id)
          REFERENCES hin (id)
          ON DELETE SET NULL 
          ON UPDATE NO ACTION)
      ENGINE = InnoDB;

      SELECT "Populating participant_last_hin table" AS "";

      REPLACE INTO participant_last_hin( participant_id, hin_id )
      SELECT participant.id, hin.id
      FROM participant
      LEFT JOIN hin ON participant.id = hin.participant_id
      AND hin.datetime <=> (
        SELECT MAX( datetime )
        FROM hin
        WHERE participant.id = hin.participant_id
        GROUP BY hin.participant_id
        LIMIT 1
      );

    END IF;

  END //
DELIMITER ;

CALL patch_participant_last_hin();
DROP PROCEDURE IF EXISTS patch_participant_last_hin;

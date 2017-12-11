DROP PROCEDURE IF EXISTS patch_participant_last_proxy;
DELIMITER //
CREATE PROCEDURE patch_participant_last_proxy()
  BEGIN

    SELECT "Creating new participant_last_proxy table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant_last_proxy" );
    IF @test = 0 THEN

      CREATE TABLE IF NOT EXISTS participant_last_proxy (
        participant_id INT UNSIGNED NOT NULL,
        proxy_id INT UNSIGNED NULL,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        PRIMARY KEY (participant_id),
        INDEX fk_proxy_id (proxy_id ASC),
        CONSTRAINT fk_participant_last_proxy_participant_id
          FOREIGN KEY (participant_id)
          REFERENCES participant (id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_participant_last_proxy_proxy_id
          FOREIGN KEY (proxy_id)
          REFERENCES proxy (id)
          ON DELETE SET NULL
          ON UPDATE CASCADE)
      ENGINE = InnoDB;

      SELECT "Populating participant_last_proxy table" AS "";

      REPLACE INTO participant_last_proxy( participant_id, proxy_id )
      SELECT participant.id, proxy.id
      FROM participant
      LEFT JOIN proxy ON participant.id = proxy.participant_id
      AND proxy.datetime <=> (
        SELECT MAX( datetime )
        FROM proxy
        WHERE participant.id = proxy.participant_id
        GROUP BY proxy.participant_id
        LIMIT 1
      );

    END IF;

  END //
DELIMITER ;

CALL patch_participant_last_proxy();
DROP PROCEDURE IF EXISTS patch_participant_last_proxy;

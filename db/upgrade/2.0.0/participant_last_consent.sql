DROP PROCEDURE IF EXISTS patch_participant_last_consent;
DELIMITER //
CREATE PROCEDURE patch_participant_last_consent()
  BEGIN

    SELECT "Adding new participant_last_consent caching table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.VIEWS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant_last_consent" );
    IF @test = 1 THEN

      DROP VIEW IF EXISTS participant_last_consent;
      CREATE TABLE IF NOT EXISTS participant_last_consent (
        participant_id INT UNSIGNED NOT NULL,
        consent_type_id INT UNSIGNED NULL,
        consent_id INT UNSIGNED NULL,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        PRIMARY KEY (participant_id,consent_type_id),
        INDEX fk_consent_id (consent_id ASC),
        CONSTRAINT fk_participant_last_consent_participant_id
          FOREIGN KEY (participant_id)
          REFERENCES participant (id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_participant_last_consent_consent_type_id
          FOREIGN KEY (consent_type_id)
          REFERENCES consent_type (id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_participant_last_consent_consent_id
          FOREIGN KEY (consent_id)
          REFERENCES consent (id)
          ON DELETE SET NULL
          ON UPDATE CASCADE)
      ENGINE = InnoDB;

      SELECT "Populating participant_last_consent table" AS "";

      REPLACE INTO participant_last_consent( participant_id, consent_type_id, consent_id )
      SELECT participant.id, consent_type.id, consent.id
      FROM participant
      CROSS JOIN consent_type
      LEFT JOIN consent ON participant.id = consent.participant_id
      AND consent_type.id = consent.consent_type_id
      AND consent.date <=> (
        SELECT MAX( date )
        FROM consent
        WHERE participant.id = consent.participant_id
        AND consent_type.id = consent.consent_type_id
        GROUP BY consent.participant_id, consent.consent_type_id
        LIMIT 1
      );

    END IF;

  END //
DELIMITER ;

CALL patch_participant_last_consent();
DROP PROCEDURE IF EXISTS patch_participant_last_consent;

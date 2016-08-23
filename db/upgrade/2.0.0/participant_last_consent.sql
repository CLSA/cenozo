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
      AND consent.datetime <=> (
        SELECT MAX( datetime )
        FROM consent
        WHERE participant.id = consent.participant_id
        AND consent_type.id = consent.consent_type_id
        GROUP BY consent.participant_id, consent.consent_type_id
        LIMIT 1
      );

    END IF;

  END //
DELIMITER ;

DROP PROCEDURE IF EXISTS patch_participant;
DELIMITER //
CREATE PROCEDURE patch_participant()
  BEGIN

    SELECT "Removing withdraw_letter column from participant table" AS "";
    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant"
      AND COLUMN_NAME = "withdraw_letter" );
    IF @test = 1 THEN
      -- insert consent records before dropping columns
      CREATE TEMPORARY TABLE new_consent
      SELECT participant.id AS participant_id,
             hin_access_consent_type.id AS consent_type_id,
             consent.datetime,
             "Added as part of the withdraw process." AS note
      FROM consent_type AS hin_access_consent_type, participant
      JOIN participant_last_consent ON participant.id = participant_last_consent.participant_id
      JOIN consent_type ON participant_last_consent.consent_type_id = consent_type.id
      JOIN consent ON participant_last_consent.consent_id = consent.id
      WHERE hin_access_consent_type.name = "HIN access"
      AND consent.accept = false
      AND consent_type.name = "participation"
      AND participant.withdraw_letter IN( "e", "f", "g", "h" );

      INSERT IGNORE INTO consent( participant_id, consent_type_id, accept, written, datetime, note )
      SELECT participant_id, consent_type_id, 0, 0, datetime, note FROM new_consent;

      ALTER TABLE participant DROP COLUMN withdraw_letter;
    END IF;

  END //
DELIMITER ;

CALL patch_participant_last_consent();
DROP PROCEDURE IF EXISTS patch_participant_last_consent;

CALL patch_participant();
DROP PROCEDURE IF EXISTS patch_participant;

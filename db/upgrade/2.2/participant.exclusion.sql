DROP PROCEDURE IF EXISTS patch_participant;
DELIMITER //
CREATE PROCEDURE patch_participant()
  BEGIN

    SELECT "Adding exclusion_id column to participant table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant"
      AND COLUMN_NAME = "exclusion_id" );
    IF @test = 0 THEN

      ALTER TABLE participant
      ADD COLUMN exclusion_id INT UNSIGNED NULL AFTER age_group_id,
      ADD KEY fk_exclusion_id (exclusion_id ASC),
      ADD CONSTRAINT fk_participant_exclusion_id
        FOREIGN KEY (exclusion_id)
        REFERENCES exclusion (id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION;

      SELECT "Transferring state_id to exclusion_id for excluded participants" AS "";

      -- anyone without consent
      UPDATE exclusion, participant
      JOIN participant_last_consent ON participant.id = participant_last_consent.participant_id
       AND participant_last_consent.consent_type_id = ( SELECT id FROM consent_type WHERE name = "participation" )
      LEFT JOIN consent ON consent_id = consent.id
      LEFT JOIN collection_has_participant ON participant.id = collection_has_participant.participant_id
       AND collection_has_participant.collection_id = ( SELECT id FROM collection WHERE name = "baseline" )
      SET participant.exclusion_id = exclusion.id
      WHERE exclusion.name = "Consent Unavailable"
      AND IFNULL( consent.accept, 0 ) != 1
      AND collection_id IS NULL;

      -- anyone with a state that coincides with an exclusion
      UPDATE participant
      LEFT JOIN collection_has_participant ON participant.id = collection_has_participant.participant_id
        AND collection_has_participant.collection_id = ( SELECT id FROM collection WHERE name = "baseline" )
      JOIN state ON participant.state_id = state.id
      JOIN exclusion ON LOWER( state.name ) = LOWER( exclusion.name )
        OR state.name = "Out of DCS Area" AND exclusion.name = "Out of Study Area"
      SET participant.exclusion_id = exclusion.id, participant.state_id = NULL
      WHERE collection_id IS NULL;

      -- everyone else not already in an exclusion who isn't in the baseline collection
      UPDATE exclusion, participant
      LEFT JOIN collection_has_participant ON participant.id = collection_has_participant.participant_id
        AND collection_has_participant.collection_id = ( SELECT id FROM collection WHERE name = "baseline" )
      SET participant.exclusion_id = exclusion.id
      WHERE collection_id IS NULL
      AND exclusion_id IS NULL;

    END IF;

  END //
DELIMITER ;

CALL patch_participant();
DROP PROCEDURE IF EXISTS patch_participant;

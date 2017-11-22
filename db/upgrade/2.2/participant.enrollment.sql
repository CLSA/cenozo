DROP PROCEDURE IF EXISTS patch_participant;
DELIMITER //
CREATE PROCEDURE patch_participant()
  BEGIN

    SELECT "Adding enrollment_id column to participant table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant"
      AND COLUMN_NAME = "enrollment_id" );
    IF @test = 0 THEN

      ALTER TABLE participant
      ADD COLUMN enrollment_id INT UNSIGNED NULL AFTER age_group_id,
      ADD KEY fk_enrollment_id (enrollment_id ASC),
      ADD CONSTRAINT fk_participant_enrollment_id
        FOREIGN KEY (enrollment_id)
        REFERENCES enrollment (id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION;

      SELECT "Transferring state_id to enrollment_id for unenrolled participants" AS "";

      -- anyone without consent
      UPDATE enrollment, participant
      JOIN participant_last_consent ON participant.id = participant_last_consent.participant_id
       AND participant_last_consent.consent_type_id = ( SELECT id FROM consent_type WHERE name = "participation" )
      LEFT JOIN consent ON consent_id = consent.id
      LEFT JOIN collection_has_participant ON participant.id = collection_has_participant.participant_id
       AND collection_has_participant.collection_id = ( SELECT id FROM collection WHERE name = "baseline" )
      SET participant.enrollment_id = enrollment.id
      WHERE enrollment.name = "consent unavailable"
      AND IFNULL( consent.accept, 0 ) != 1
      AND collection_id IS NULL;

      -- anyone with a state that coincides with an enrollment
      UPDATE participant
      LEFT JOIN collection_has_participant ON participant.id = collection_has_participant.participant_id
        AND collection_has_participant.collection_id = ( SELECT id FROM collection WHERE name = "baseline" )
      JOIN state ON participant.state_id = state.id
      JOIN enrollment ON LOWER( state.name ) = LOWER( enrollment.name )
        OR state.name = "Out of DCS Area" AND enrollment.name = "out of study area"
      SET participant.enrollment_id = enrollment.id, participant.state_id = NULL
      WHERE collection_id IS NULL;

      -- everyone else not already in an enrollment who isn't in the baseline collection
      UPDATE enrollment, participant
      LEFT JOIN collection_has_participant ON participant.id = collection_has_participant.participant_id
        AND collection_has_participant.collection_id = ( SELECT id FROM collection WHERE name = "baseline" )
      SET participant.enrollment_id = enrollment.id
      WHERE collection_id IS NULL
      AND enrollment_id IS NULL;

    END IF;

  END //
DELIMITER ;

CALL patch_participant();
DROP PROCEDURE IF EXISTS patch_participant;

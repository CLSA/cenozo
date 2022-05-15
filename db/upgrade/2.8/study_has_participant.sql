DROP PROCEDURE IF EXISTS patch_study_has_participant;
DELIMITER //
CREATE PROCEDURE patch_study_has_participant()
  BEGIN

    SELECT "Creating new study_has_participant table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.TABLES
    WHERE table_schema = DATABASE()
    AND table_name = "study_has_participant";

    IF 0 = @total THEN
      CREATE TABLE study_has_participant (
        study_id INT(10) UNSIGNED NOT NULL,
        participant_id INT(10) UNSIGNED NOT NULL,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        PRIMARY KEY (study_id, participant_id),
        INDEX fk_participant_id (participant_id ASC),
        INDEX fk_study_id (study_id ASC),
        CONSTRAINT fk_study_has_participant_study_id
          FOREIGN KEY (study_id)
          REFERENCES study (id)
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT fk_study_has_participant_participant_id
          FOREIGN KEY (participant_id)
          REFERENCES participant (id)
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      );
    END IF;

    -- now populate all sub-study participants based on participants released to applications
    INSERT INTO study_has_participant( study_id, participant_id )
    SELECT DISTINCT study.id, application_has_participant.participant_id
    FROM application
    JOIN study_phase ON application.study_phase_id = study_phase.id
    JOIN study ON study_phase.study_id = study.id
    JOIN application_has_participant ON application.id = application_has_participant.application_id
    WHERE application_has_participant.datetime IS NOT NULL;

  END //
DELIMITER ;

CALL patch_study_has_participant();
DROP PROCEDURE IF EXISTS patch_study_has_participant;

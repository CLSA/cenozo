DROP PROCEDURE IF EXISTS patch_study_phase_status;
DELIMITER //
CREATE PROCEDURE patch_study_phase_status()
  BEGIN

    SELECT "Creating new study_phase_status table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.TABLES
    WHERE table_schema = DATABASE()
    AND table_name = "study_phase_status";

    IF @test = 0 THEN
      CREATE TABLE study_phase_status (
        id int(10) unsigned NOT NULL AUTO_INCREMENT,
        update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
          ON UPDATE current_timestamp(),
        create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
        participant_id int(10) unsigned NOT NULL,
        study_phase_id int(10) unsigned NOT NULL,
        status VARCHAR(127) NULL DEFAULT NULL,
        detail VARCHAR(127) NULL DEFAULT NULL,
        note MEDIUMTEXT NULL DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_participant_id_study_phase_id (participant_id,study_phase_id),
        KEY fk_participant_id (participant_id),
        KEY fk_study_phase_id (study_phase_id),
        CONSTRAINT fk_study_phase_status_participant_id
          FOREIGN KEY (participant_id)
          REFERENCES participant (id)
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT fk_study_phase_status_study_phase_id
          FOREIGN KEY (study_phase_id)
          REFERENCES study_phase (id)
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

      INSERT INTO study_phase_status (participant_id, study_phase_id)
      SELECT participant.id, study_phase.id
      FROM participant, study_phase;
    END IF;

  END //
DELIMITER ;

CALL patch_study_phase_status();
DROP PROCEDURE IF EXISTS patch_study_phase_status;

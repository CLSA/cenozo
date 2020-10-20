DROP PROCEDURE IF EXISTS patch_study_phase;
DELIMITER //
CREATE PROCEDURE patch_study_phase()
  BEGIN

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "study_phase"
    AND column_name = "study_id";

    IF 0 = @test THEN
      ALTER TABLE study_phase
      ADD COLUMN study_id INT UNSIGNED NOT NULL AFTER create_timestamp,
      ADD INDEX fk_study_id ( study_id ASC ),
      DROP INDEX uq_rank,
      DROP INDEX uq_name,
      DROP INDEX uq_code;

      UPDATE study_phase
      JOIN study ON study.name = IF( study_phase.code RLIKE "b[1-9]", "Back Pain", "CLSA" )
      SET study_phase.study_id = study.id;

      ALTER TABLE study_phase
      ADD CONSTRAINT fk_study_phase_study_id
          FOREIGN KEY (study_id)
          REFERENCES study (id)
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
      ADD UNIQUE INDEX uq_study_id_rank (study_id ASC, rank ASC),
      ADD UNIQUE INDEX uq_study_id_code (study_id ASC, code ASC),
      ADD UNIQUE INDEX uq_study_id_name (study_id ASC, name ASC);
    END IF;

  END //
DELIMITER ;

CALL patch_study_phase();
DROP PROCEDURE IF EXISTS patch_study_phase;

INSERT IGNORE INTO study_phase( study_id, rank, code, name )
SELECT study.id, 1, 'bl', 'Baseline'
FROM study
WHERE name LIKE "COVID%";

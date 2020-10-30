DROP PROCEDURE IF EXISTS patch_participant;
DELIMITER //
CREATE PROCEDURE patch_participant()
  BEGIN

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "participant"
    AND column_name = "override_quota";

    IF 1 = @test THEN
      ALTER TABLE participant
      CHANGE COLUMN override_quota override_stratum tinyint(1) NOT NULL DEFAULT 0;
    END IF;

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "participant"
    AND column_name = "age_group_id";

    IF 1 = @test THEN
      ALTER TABLE participant
      DROP CONSTRAINT fk_participant_age_group_id,
      DROP INDEX fk_age_group_id,
      DROP COLUMN age_group_id;
    END IF;

  END //
DELIMITER ;

CALL patch_participant();
DROP PROCEDURE IF EXISTS patch_participant;

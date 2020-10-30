DROP PROCEDURE IF EXISTS patch_source;
DELIMITER //
CREATE PROCEDURE patch_source()
  BEGIN

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "source"
    AND column_name = "override_quota";

    IF 1 = @test THEN
      ALTER TABLE source
      CHANGE COLUMN override_quota override_stratum tinyint(1) NOT NULL DEFAULT 0;
    END IF;

  END //
DELIMITER ;

CALL patch_source();
DROP PROCEDURE IF EXISTS patch_source;

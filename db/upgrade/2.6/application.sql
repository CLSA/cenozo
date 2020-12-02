DROP PROCEDURE IF EXISTS patch_application;
DELIMITER //
CREATE PROCEDURE patch_application()
  BEGIN

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "application"
    AND column_name = "update_participant_site";

    IF 0 = @test THEN
      ALTER TABLE application
      ADD COLUMN update_participant_site TINYINT(1) NOT NULL DEFAULT 0 AFTER update_queue;

      UPDATE application
      JOIN application_type ON application.application_type_id = application_type.id
      SET update_participant_site = true
      WHERE application_type.name IN( "beartooth", "cedar", "sabretooth" )
      AND application.version RLIKE "^2\.[0-9]\+$";
    END IF;

  END //
DELIMITER ;

CALL patch_application();
DROP PROCEDURE IF EXISTS patch_application;

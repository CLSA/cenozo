DROP PROCEDURE IF EXISTS patch_application;
DELIMITER //
CREATE PROCEDURE patch_application()
  BEGIN

    SELECT "Making application.release_event_type_id column optional" AS "";

    SET @test = ( 
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "application"
      AND COLUMN_NAME = "release_event_type_id"
      AND IS_NULLABLE = "NO" );
    IF @test = 1 THEN
      ALTER TABLE application MODIFY release_event_type_id INT(10) UNSIGNED NULL DEFAULT NULL;
    END IF;

    SELECT "Adding study_phase_id column to application table" AS "";

    SET @test = ( 
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "application"
      AND COLUMN_NAME = "study_phase_id" );
    IF @test = 0 THEN
      ALTER TABLE application
      ADD COLUMN study_phase_id INT UNSIGNED NULL DEFAULT NULL,
      ADD INDEX fk_study_phase_id (study_phase_id ASC),
      ADD CONSTRAINT fk_application_study_phase_id
        FOREIGN KEY (study_phase_id)
        REFERENCES study_phase (id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION;

      UPDATE study_phase, application
      JOIN application_type ON application.application_type_id = application_type.id
      SET application.study_phase_id = study_phase.id
      WHERE study_phase.rank = 1
      AND application_type.name IN ( "beartooth", "cedar", "sabretooth" )
      AND application.name = application_type.name;

      UPDATE application
      JOIN application_type ON application.application_type_id = application_type.id
      JOIN study_phase ON REPLACE( application.name, CONCAT( application_type.name, "_f" ), "" ) = study_phase.rank-1
      SET application.study_phase_id = study_phase.id
      WHERE application_type.name IN ( "beartooth", "cedar", "sabretooth" )
      AND application.name RLIKE "_f[0-9]+$";
    END IF;

  END //
DELIMITER ;

CALL patch_application();
DROP PROCEDURE IF EXISTS patch_application;

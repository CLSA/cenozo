DROP PROCEDURE IF EXISTS patch_application;
DELIMITER //
CREATE PROCEDURE patch_application()
  BEGIN

    SELECT "Renaming service table to application and adding/removing columns" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "application" );
    IF @test = 0 THEN
      -- rename table
      RENAME TABLE service TO application;

      -- drop language_id column
      ALTER TABLE application
      DROP FOREIGN KEY fk_service_language_id,
      DROP INDEX fk_language_id,
      DROP COLUMN language_id;

      -- rename service_release_event_type_id key
      ALTER TABLE application
      DROP FOREIGN KEY fk_service_release_event_type_id,
      ADD CONSTRAINT fk_application_release_event_type_id
      FOREIGN KEY (release_event_type_id) REFERENCES event_type (id)
      ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE application
      ADD COLUMN url VARCHAR(511) NOT NULL AFTER title,
      ADD COLUMN type VARCHAR(45) NOT NULL AFTER title,
      ADD COLUMN country VARCHAR(45) NOT NULL,
      ADD COLUMN timezone VARCHAR(45) NOT NULL DEFAULT 'Canada/Eastern',
      ADD COLUMN update_queue TINYINT(1) NOT NULL DEFAULT 0,
      ADD COLUMN primary_color CHAR(7) NOT NULL DEFAULT '#3f3f7d',
      ADD COLUMN secondary_color CHAR(7) NOT NULL DEFAULT '#359a92',
      ADD COLUMN theme_expired TINYINT(1) NOT NULL DEFAULT 1;
      
      UPDATE application SET
        type = IF( LOCATE( "_", name ), SUBSTRING( name, 1, LOCATE( "_", name )-1 ), name ),
        url = CONCAT( 'https://localhost/', name ),
        country = 'Canada';

      UPDATE application SET update_queue = 1
      WHERE type IN ( "beartooth", "sabretooth" )
      AND name != "sabretooth_qc";
    END IF;

  END //
DELIMITER ;

CALL patch_application();
DROP PROCEDURE IF EXISTS patch_application;

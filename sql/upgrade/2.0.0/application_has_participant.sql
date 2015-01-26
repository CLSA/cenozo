DROP PROCEDURE IF EXISTS patch_application_has_participant;
DELIMITER //
CREATE PROCEDURE patch_application_has_participant()
  BEGIN

    SELECT "Renaming service_has_participant table to application_has_participant" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "application_has_participant" );
    IF @test = 0 THEN
      -- rename table
      RENAME TABLE service_has_participant TO application_has_participant;

      -- drop keys
      ALTER TABLE application_has_participant
      DROP FOREIGN KEY fk_service_has_participant_service_id,
      DROP FOREIGN KEY fk_service_has_participant_participant_id,
      DROP FOREIGN KEY fk_service_has_participant_preferred_site_id;

      -- rename columns
      ALTER TABLE application_has_participant
      CHANGE service_id application_id INT UNSIGNED NOT NULL;

      -- rename keys
      ALTER TABLE application_has_participant
      DROP KEY fk_service_id,
      ADD KEY fk_application_id (application_id);

      ALTER TABLE application_has_participant
      ADD CONSTRAINT fk_application_has_participant_application_id
      FOREIGN KEY (application_id) REFERENCES application (id)
      ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE application_has_participant
      ADD CONSTRAINT fk_application_has_participant_participant_id
      FOREIGN KEY (participant_id) REFERENCES participant (id)
      ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE application_has_participant
      ADD CONSTRAINT fk_application_has_participant_preferred_site_id
      FOREIGN KEY (preferred_site_id) REFERENCES site (id)
      ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;

  END //
DELIMITER ;

CALL patch_application_has_participant();
DROP PROCEDURE IF EXISTS patch_application_has_participant;

DROP PROCEDURE IF EXISTS patch_application_has_cohort;
DELIMITER //
CREATE PROCEDURE patch_application_has_cohort()
  BEGIN

    SELECT "Renaming service_has_cohort table to application_has_cohort" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "application_has_cohort" );
    IF @test = 0 THEN
      -- rename table
      RENAME TABLE service_has_cohort TO application_has_cohort;

      -- drop keys
      ALTER TABLE application_has_cohort
      DROP FOREIGN KEY fk_service_has_cohort_service_id,
      DROP FOREIGN KEY fk_service_has_cohort_cohort_id;

      -- rename columns
      ALTER TABLE application_has_cohort
      CHANGE service_id application_id INT UNSIGNED NOT NULL;

      -- rename keys
      ALTER TABLE application_has_cohort
      DROP KEY fk_service_id,
      ADD KEY fk_application_id (application_id);

      ALTER TABLE application_has_cohort
      ADD CONSTRAINT fk_application_has_cohort_application_id
      FOREIGN KEY (application_id) REFERENCES application (id)
      ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE application_has_cohort
      ADD CONSTRAINT fk_application_has_cohort_cohort_id
      FOREIGN KEY (cohort_id) REFERENCES cohort (id)
      ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;

  END //
DELIMITER ;

CALL patch_application_has_cohort();
DROP PROCEDURE IF EXISTS patch_application_has_cohort;

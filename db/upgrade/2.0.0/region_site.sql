DROP PROCEDURE IF EXISTS patch_region_site;
DELIMITER //
CREATE PROCEDURE patch_region_site()
  BEGIN

    SELECT "Renaming service_id column to application_id in region_site table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "region_site"
      AND COLUMN_NAME = "application_id" );
    IF @test = 0 THEN
      -- drop foreign keys
      ALTER TABLE region_site
      DROP FOREIGN KEY fk_region_site_service_id;

      -- rename column
      ALTER TABLE region_site
      CHANGE service_id application_id INT UNSIGNED NOT NULL;

      -- rename keys
      ALTER TABLE region_site
      DROP KEY fk_service_id,
      ADD KEY fk_application_id (application_id);

      ALTER TABLE region_site
      DROP KEY uq_service_id_region_id_language_id,
      ADD UNIQUE KEY `uq_application_id_region_id_language_id` (`application_id` ASC, `region_id` ASC, `language_id` ASC);

      ALTER TABLE region_site
      ADD CONSTRAINT fk_region_site_application_id
      FOREIGN KEY (application_id) REFERENCES application (id)
      ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;

  END //
DELIMITER ;

CALL patch_region_site();
DROP PROCEDURE IF EXISTS patch_region_site;

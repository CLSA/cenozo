DROP PROCEDURE IF EXISTS patch_site;
DELIMITER //
CREATE PROCEDURE patch_site()
  BEGIN

    SELECT "Renaming service_id column to application_id in site table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "site"
      AND COLUMN_NAME = "application_id" );
    IF @test = 0 THEN
      -- drop foreign keys
      ALTER TABLE site
      DROP FOREIGN KEY fk_site_service_id;

      -- rename column
      ALTER TABLE site
      CHANGE service_id application_id INT UNSIGNED NOT NULL;

      -- rename keys
      ALTER TABLE site
      DROP KEY fk_service_id,
      ADD KEY fk_application_id (application_id);

      ALTER TABLE site
      DROP KEY uq_name_service_id,
      ADD UNIQUE KEY uq_name_application_id (name ASC, application_id ASC);

      ALTER TABLE site
      ADD CONSTRAINT fk_site_application_id
      FOREIGN KEY (application_id) REFERENCES application (id)
      ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;

  END //
DELIMITER ;

CALL patch_site();
DROP PROCEDURE IF EXISTS patch_site;

DROP PROCEDURE IF EXISTS patch_application_has_site;
DELIMITER //
CREATE PROCEDURE patch_application_has_site()
  BEGIN

    SELECT "Creating new application_has_site table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "application_has_site" );
    IF @test = 0 THEN

      CREATE TABLE IF NOT EXISTS application_has_site (
        application_id INT UNSIGNED NOT NULL,
        site_id INT UNSIGNED NOT NULL,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        PRIMARY KEY (application_id, site_id),
        INDEX fk_site_id (site_id ASC),
        INDEX fk_application_id (application_id ASC),
        CONSTRAINT fk_application_has_site_application_id
          FOREIGN KEY (application_id)
          REFERENCES application (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_application_has_site_site_id
          FOREIGN KEY (site_id)
          REFERENCES site (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION)
      ENGINE = InnoDB;

      -- this is clsa-specific
      INSERT INTO application_has_site( application_id, site_id )
      SELECT application.id, site.id
      FROM application, site
      WHERE application.type = "mastodon"
      UNION SELECT application.id, site.id
      FROM application, site
      WHERE application.type = "beartooth"
      AND site.name LIKE "% DCS"
      UNION SELECT application.id, site.id
      FROM application, site
      WHERE application.type = "sabretooth" AND application.name != "sabretooth_qc"
      AND site.name LIKE "% CATI"
      UNION SELECT application.id, site.id
      FROM application, site
      WHERE application.name = "sabretooth_qc"
      AND site.name LIKE "% QC"
      UNION SELECT application.id, site.id
      FROM application, site
      WHERE application.type = "cedar"
      AND site.name LIKE "% REC";

      DELETE FROM application_has_site
      WHERE application_id = ( SELECT id FROM application WHERE name = "sabretooth_mc" )
      AND site_id = ( SELECT id FROM site WHERE name = "Victoria CATI" );

      DELETE FROM application_has_site
      WHERE application_id = ( SELECT id FROM application WHERE name = "sabretooth" )
      AND site_id = ( SELECT id FROM site WHERE name = "Simon Fraser CATI" );

    END IF;

  END //
DELIMITER ;

CALL patch_application_has_site();
DROP PROCEDURE IF EXISTS patch_application_has_site;

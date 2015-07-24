DROP PROCEDURE IF EXISTS patch_site;
DELIMITER //
CREATE PROCEDURE patch_site()
  BEGIN

    SELECT "Removing service_id from site table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "site"
      AND COLUMN_NAME = "service_id" );
    IF @test = 1 THEN
      -- rename sites before we proceed (this is CLSA specific)
      UPDATE site
      JOIN application ON site.service_id = application.id
      SET site.name = CONCAT( site.name, " DCS" )
      WHERE application.name = "beartooth";
      UPDATE site
      JOIN application ON site.service_id = application.id
      SET site.name = CONCAT( site.name, " REC" )
      WHERE application.name = "cedar";
      UPDATE site
      JOIN application ON site.service_id = application.id
      SET site.name = CONCAT( site.name, " CATI" )
      WHERE application.name = "sabretooth" OR application.name = "sabretooth_mc";
      UPDATE site
      JOIN application ON site.service_id = application.id
      SET site.name = CONCAT( site.name, " QC" )
      WHERE application.name = "sabretooth_qc";

      -- drop foreign keys
      ALTER TABLE site
      DROP FOREIGN KEY fk_site_service_id,
      DROP KEY fk_service_id,
      DROP KEY uq_name_service_id,
      DROP COLUMN service_id,
      ADD UNIQUE KEY uq_name (name);
    END IF;

  END //
DELIMITER ;

CALL patch_site();
DROP PROCEDURE IF EXISTS patch_site;

SELECT "Modifying site.timezone to be VARCHAR instead of ENUM" AS "";
ALTER TABLE site MODIFY timezone VARCHAR(45) NOT NULL DEFAULT 'Canada/Eastern';

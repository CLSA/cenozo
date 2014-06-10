DROP PROCEDURE IF EXISTS patch_region_site;
DELIMITER //
CREATE PROCEDURE patch_region_site()
  BEGIN

    SELECT "Add new region_site column to region_site table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "region_site"
      AND COLUMN_NAME = "language_id" );
    IF @test = 0 THEN
      ALTER TABLE region_site
      ADD COLUMN language_id INT UNSIGNED NOT NULL
      AFTER region_id;

      UPDATE region_site SET language_id = (
        SELECT id FROM language WHERE code = "en" );

      ALTER TABLE region_site
      ADD INDEX fk_language_id (language_id ASC);

      ALTER TABLE region_site
      ADD CONSTRAINT fk_region_site_language_id
      FOREIGN KEY (language_id)
      REFERENCES language (id)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION;

      ALTER TABLE region_site
      ADD UNIQUE INDEX uq_service_id_region_id_language_id
      ( service_id, region_id, language_id );

      ALTER TABLE region_site
      DROP INDEX uq_service_id_region_id;
    END IF;

  END //
DELIMITER ;

CALL patch_region_site();
DROP PROCEDURE IF EXISTS patch_region_site;

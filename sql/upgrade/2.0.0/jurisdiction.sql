DROP PROCEDURE IF EXISTS patch_jurisdiction;
DELIMITER //
CREATE PROCEDURE patch_jurisdiction()
  BEGIN

    SELECT "Renaming service_id column to application_id in jurisdiction table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "jurisdiction"
      AND COLUMN_NAME = "application_id" );
    IF @test = 0 THEN
      -- drop foreign keys
      ALTER TABLE jurisdiction
      DROP FOREIGN KEY fk_jurisdiction_service_id;

      -- rename column
      ALTER TABLE jurisdiction
      CHANGE service_id application_id INT UNSIGNED NOT NULL;

      -- rename keys
      ALTER TABLE jurisdiction
      DROP KEY fk_service_id,
      ADD KEY fk_application_id (application_id);

      ALTER TABLE jurisdiction
      DROP KEY uq_service_id_postcode,
      ADD UNIQUE KEY uq_application_id_postcode (application_id ASC, postcode ASC);

      ALTER TABLE jurisdiction
      ADD CONSTRAINT fk_jurisdiction_application_id
      FOREIGN KEY (application_id) REFERENCES application (id)
      ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;

  END //
DELIMITER ;

CALL patch_jurisdiction();
DROP PROCEDURE IF EXISTS patch_jurisdiction;

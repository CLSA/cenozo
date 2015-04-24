DROP PROCEDURE IF EXISTS patch_jurisdiction;
DELIMITER //
CREATE PROCEDURE patch_jurisdiction()
  BEGIN

    SELECT "Removing service_id column from jurisdiction table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "jurisdiction"
      AND COLUMN_NAME = "service_id" );
    IF @test = 1 THEN
      -- drop foreign keys, key and column
      ALTER TABLE jurisdiction
      DROP FOREIGN KEY fk_jurisdiction_service_id,
      DROP KEY fk_service_id,
      DROP COLUMN service_id,
      DROP KEY uq_service_id_postcode,
      ADD UNIQUE KEY uq_site_id_postcode (site_id ASC, postcode ASC),
      MODIFY COLUMN site_id INT(10) UNSIGNED NOT NULL AFTER create_timestamp;
    END IF;

  END //
DELIMITER ;

CALL patch_jurisdiction();
DROP PROCEDURE IF EXISTS patch_jurisdiction;

SELECT "Adding new triggers to jurisdiction table" AS "";

-- create trigger to enforce application-postcode pseudo unique key
DELIMITER //
DROP TRIGGER IF EXISTS jurisdiction_BEFORE_INSERT //
CREATE TRIGGER jurisdiction_BEFORE_INSERT
BEFORE INSERT ON jurisdiction FOR EACH ROW
BEGIN
  SET @test = (
    SELECT COUNT(*) FROM jurisdiction
    JOIN site ON jurisdiction.site_id = site.id
    WHERE jurisdiction.postcode = NEW.postcode
    AND site.application_id = (
      SELECT application_id FROM site
      WHERE id = NEW.site_id
    )
  );
  IF @test > 0 THEN
    -- trigger unique key conflict
    SET @sql = CONCAT(
      "Duplicate entry '",
      NEW.site_id, "-", NEW.postcode,
      "' for key 'uq_site_id_postcode'"
    );
    SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = @sql, MYSQL_ERRNO = 1062;
  END IF;
END;//

DROP TRIGGER IF EXISTS jurisdiction_BEFORE_UPDATE //
CREATE TRIGGER jurisdiction_BEFORE_UPDATE
BEFORE UPDATE ON jurisdiction FOR EACH ROW
BEGIN
  SET @test = (
    SELECT COUNT(*) FROM jurisdiction
    JOIN site ON jurisdiction.site_id = site.id
    WHERE jurisdiction.postcode = NEW.postcode
    AND site.application_id = (
      SELECT application_id FROM site
      WHERE id = NEW.site_id
    )
    AND jurisdiction.id != NEW.id
  );
  IF @test > 0 THEN
    -- trigger unique key conflict
    SET @sql = CONCAT(
      "Duplicate entry '",
      NEW.site_id, "-", NEW.postcode,
      "' for key 'uq_site_id_postcode'"
    );
    SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = @sql, MYSQL_ERRNO = 1062;
  END IF;
END;//

DELIMITER ;

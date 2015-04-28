DROP PROCEDURE IF EXISTS patch_quota;
DELIMITER //
CREATE PROCEDURE patch_quota()
  BEGIN

    SELECT "Renaming gender to sex in quota table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "quota"
      AND COLUMN_NAME = "gender" );
    IF @test = 1 THEN
      -- drop unique key, rename column, re-create key
      ALTER TABLE quota
      DROP INDEX uq_region_id_site_id_gender_age_group_id,
      CHANGE gender sex ENUM('male','female') NOT NULL,
      ADD UNIQUE INDEX uq_region_id_site_id_sex_age_group_id
      (region_id ASC, site_id ASC, sex ASC, age_group_id ASC);
    END IF;

  END //
DELIMITER ;

CALL patch_quota();
DROP PROCEDURE IF EXISTS patch_quota;

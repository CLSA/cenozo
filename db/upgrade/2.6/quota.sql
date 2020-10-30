DROP PROCEDURE IF EXISTS patch_quota;
DELIMITER //
CREATE PROCEDURE patch_quota()
  BEGIN

    SELECT COUNT(*) INTO @test
    FROM information_schema.TABLES
    WHERE table_schema = DATABASE()
    AND table_name = "quota";

    IF 1 = @test THEN
      SELECT "Transferring quotas to strata" AS "";

      INSERT INTO stratum( study_id, name, description )
      SELECT study.id,
        CONCAT_WS( ", ", site.name, region.abbreviation, sex, CONCAT_WS( " to ", age_group.lower, age_group.upper ) ),
        CONCAT( "Participants belonging to the ", site.name, " site, who live in ", region.name, ", who are ", sex,
                ", and between the age ", lower, " and ", upper, " at the time of recruitment." )
      FROM study, quota
      JOIN region ON quota.region_id = region.id
      JOIN site ON quota.site_id = site.id
      JOIN age_group ON quota.age_group_id = age_group.id
      WHERE study.name = "CLSA"
      ORDER BY site.name, region.abbreviation, sex, age_group.lower;

      SELECT "Dropping defunct quota table" AS "";
      DROP TABLE quota;
    END IF;

  END //
DELIMITER ;

CALL patch_quota();
DROP PROCEDURE IF EXISTS patch_quota;

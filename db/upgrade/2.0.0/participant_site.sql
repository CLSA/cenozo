DROP PROCEDURE IF EXISTS patch_participant_site;

DELIMITER //

CREATE PROCEDURE patch_participant_site()
  BEGIN

    SELECT "Replacing participant_site view with new caching table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.VIEWS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant_site" );
    IF @test = 1 THEN
      DROP VIEW IF EXISTS participant_site;

      CREATE TABLE IF NOT EXISTS participant_site (
        application_id INT UNSIGNED NOT NULL,
        participant_id INT UNSIGNED NOT NULL,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        site_id INT UNSIGNED NULL,
        default_site_id INT UNSIGNED NULL,
        PRIMARY KEY (application_id, participant_id),
        INDEX fk_application_id (application_id ASC),
        INDEX fk_participant_id (participant_id ASC),
        INDEX fk_site_id (site_id ASC),
        INDEX fk_default_site_id (default_site_id ASC),
        CONSTRAINT fk_participant_site_application_id
          FOREIGN KEY (application_id)
          REFERENCES application (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_participant_site_participant_id
          FOREIGN KEY (participant_id)
          REFERENCES participant (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_participant_site_site_id
          FOREIGN KEY (site_id)
          REFERENCES site (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_participant_site_default_site_id
          FOREIGN KEY (default_site_id)
          REFERENCES site (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION)
      ENGINE = InnoDB;

      SELECT "Populating participant_site table based on jurisdictions" AS "";

      REPLACE INTO participant_site( application_id, participant_id, site_id, default_site_id )
      SELECT application.id,
             participant.id,
             IF(
               ISNULL( application_has_participant.preferred_site_id ),
               jurisdiction.site_id,
               application_has_participant.preferred_site_id
             ),
             jurisdiction.site_id
      FROM application
      CROSS JOIN participant
      JOIN application_has_cohort ON application.id = application_has_cohort.application_id
      AND application_has_cohort.cohort_id = participant.cohort_id
      LEFT JOIN participant_primary_address ON participant.id = participant_primary_address.participant_id
      LEFT JOIN address ON participant_primary_address.address_id = address.id
      LEFT JOIN jurisdiction ON address.postcode = jurisdiction.postcode
      AND jurisdiction.site_id IN ( SELECT id FROM site WHERE application_id = application.id )
      LEFT JOIN site ON jurisdiction.site_id = site.id
      AND application.id = site.application_id
      LEFT JOIN application_has_participant ON application.id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
      WHERE application_has_cohort.grouping = "jurisdiction";

      SELECT "Populating participant_site table based on region_sites" AS "";

      REPLACE INTO participant_site( application_id, participant_id, site_id, default_site_id )
      SELECT application.id,
             participant.id,
             IF(
               ISNULL( application_has_participant.preferred_site_id ),
               region_site.site_id,
               application_has_participant.preferred_site_id
             ),
             region_site.site_id
      FROM application
      CROSS JOIN participant
      JOIN application_has_cohort ON application.id = application_has_cohort.application_id
      AND application_has_cohort.cohort_id = participant.cohort_id
      LEFT JOIN participant_primary_address ON participant.id = participant_primary_address.participant_id
      LEFT JOIN address ON participant_primary_address.address_id = address.id
      LEFT JOIN region_site ON address.region_id = region_site.region_id
      AND IFNULL( participant.language_id, application.language_id ) = region_site.language_id
      AND region_site.site_id IN ( SELECT id FROM site WHERE application_id = application.id )
      LEFT JOIN site ON region_site.site_id = site.id
      AND application.id = site.application_id
      LEFT JOIN application_has_participant ON application.id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
      WHERE application_has_cohort.grouping = "region";
    END IF;

  END //

DELIMITER ;

CALL patch_participant_site();
DROP PROCEDURE IF EXISTS patch_participant_site;

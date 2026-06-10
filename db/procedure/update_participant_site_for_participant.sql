CREATE DEFINER=patrick@localhost PROCEDURE update_participant_site_for_participant( IN proc_participant_id INT(10) UNSIGNED )
BEGIN

    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_beartooth_bl.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_beartooth_bl.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 2
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_beartooth_ca.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_beartooth_ca.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 32
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_beartooth_f1.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_beartooth_f1.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 7
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_beartooth_f2.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_beartooth_f2.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 12
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_beartooth_f3.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_beartooth_f3.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 35
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_beartooth_f4.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_beartooth_f4.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 48
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_cedar_c1.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_cedar_c1.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 43
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_cedar_c2.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_cedar_c2.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 47
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_cedar_cb.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_cedar_cb.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 40
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_cedar_f1.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_cedar_f1.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 9
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_cedar_f2.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_cedar_f2.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 14
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_cedar_f3.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_cedar_f3.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 36
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_cedar_f4.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_cedar_f4.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 52
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_sabretooth_c1.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_sabretooth_c1.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 44
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_sabretooth_c2.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_sabretooth_c2.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 46
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_sabretooth_ca.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_sabretooth_ca.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 31
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_sabretooth_cb.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_sabretooth_cb.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 34
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_sabretooth_cd.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_sabretooth_cd.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 33
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_sabretooth_co.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_sabretooth_co.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 22
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_sabretooth_ds.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_sabretooth_ds.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 41
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_sabretooth_f1.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_sabretooth_f1.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 8
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_sabretooth_f2.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_sabretooth_f2.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 13
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_sabretooth_f3.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_sabretooth_f3.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 37
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_sabretooth_f4.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_sabretooth_f4.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 49
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_sabretooth_mc.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_sabretooth_mc.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 4
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_sabretooth_p2.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_sabretooth_p2.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 38
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_sabretooth_p3.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_sabretooth_p3.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 42
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_sabretooth_p4.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_sabretooth_p4.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 51
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_sabretooth_q4.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_sabretooth_q4.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 55
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_sabretooth_qc.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_sabretooth_qc.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 6
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_sabretooth_s3.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_sabretooth_s3.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 45
    AND participant.id = proc_participant_id;
    REPLACE INTO patrick_cenozo.participant_site( application_id, participant_id, site_id, default_site_id )
    SELECT
      application_has_cohort.application_id,
      participant.id,
      IF(
        ISNULL( application_has_participant.preferred_site_id ),
        IF(
          application_has_cohort.grouping = "jurisdiction",
          jurisdiction.site_id,
          region_site.site_id
        ),
        application_has_participant.preferred_site_id
      ) AS site_id,
      IF(
        application_has_cohort.grouping = "jurisdiction",
        jurisdiction.site_id,
        region_site.site_id
      ) AS default_site_id
    FROM patrick_cenozo.application_has_cohort
    JOIN patrick_cenozo.participant
    ON application_has_cohort.cohort_id = participant.cohort_id
    LEFT JOIN patrick_cenozo.participant_primary_address
    ON participant.id = participant_primary_address.participant_id
    LEFT JOIN patrick_cenozo.address
    ON participant_primary_address.address_id = address.id
    LEFT JOIN patrick_sabretooth_s4.jurisdiction
    ON address.postcode = jurisdiction.postcode
    LEFT JOIN patrick_cenozo.site AS jurisdiction_site
    ON jurisdiction.site_id = jurisdiction_site.id
    LEFT JOIN patrick_cenozo.region
    ON address.region_id = region.id
    LEFT JOIN patrick_sabretooth_s4.region_site
    ON region.id = region_site.region_id
    LEFT JOIN patrick_cenozo.site AS region_site_site
     
    ON region_site.site_id = region_site_site.id
      AND participant.language_id = region_site.language_id
    LEFT JOIN patrick_cenozo.application_has_participant
     
    ON application_has_cohort.application_id = application_has_participant.application_id
      AND application_has_participant.participant_id = participant.id
    WHERE jurisdiction.site_id <=> jurisdiction_site.id
    AND region_site.site_id <=> region_site_site.id
    AND application_has_cohort.application_id = 50
    AND participant.id = proc_participant_id;  END ;;

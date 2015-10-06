SELECT "Creating new update_participant_site_for_participant" AS "";

DROP procedure IF EXISTS update_participant_site_for_participant;

DELIMITER $$
CREATE PROCEDURE update_participant_site_for_participant(IN proc_participant_id INT(10) UNSIGNED)
BEGIN
  REPLACE INTO participant_site( application_id, participant_id, site_id, default_site_id )
  SELECT application.id,
         participant.id,
         IF(
           ISNULL( application_has_participant.preferred_site_id ),
           IF(
             application_has_cohort.grouping = 'jurisdiction',
             jurisdiction.site_id,
             region_site.site_id
           ),
           application_has_participant.preferred_site_id
         ) AS site_id,
         IF(
           application_has_cohort.grouping = 'jurisdiction',
           jurisdiction.site_id,
           region_site.site_id
         ) AS default_site_id
  FROM application
  CROSS JOIN participant
  JOIN application_has_cohort ON application.id = application_has_cohort.application_id
  AND application_has_cohort.cohort_id = participant.cohort_id
  LEFT JOIN participant_primary_address ON participant.id = participant_primary_address.participant_id
  LEFT JOIN address ON participant_primary_address.address_id = address.id
  LEFT JOIN jurisdiction ON address.postcode = jurisdiction.postcode
  AND jurisdiction.site_id IN (
    SELECT site_id FROM application_has_site WHERE application_id = application.id
  )
  LEFT JOIN site AS jurisdiction_site ON jurisdiction.site_id = jurisdiction_site.id
  LEFT JOIN region ON address.region_id = region.id
  LEFT JOIN region_site ON region.id = region_site.region_id
  AND region_site.site_id IN (
    SELECT site_id FROM application_has_site WHERE application_id = application.id
  )
  LEFT JOIN site AS region_site_site ON region_site.site_id = region_site_site.id
  AND participant.language_id = region_site.language_id
  LEFT JOIN application_has_participant ON application.id = application_has_participant.application_id
  AND application_has_participant.participant_id = participant.id
  WHERE participant.id = proc_participant_id
  -- we need to match the sites or we might get links to sites in the wrong application
  AND jurisdiction.site_id <=> jurisdiction_site.id
  AND region_site.site_id <=> region_site_site.id;
END$$

DELIMITER ;

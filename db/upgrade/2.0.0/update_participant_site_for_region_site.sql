SELECT "Creating new update_participant_site_for_region_site" AS "";

DROP procedure IF EXISTS update_participant_site_for_region_site;

DELIMITER $$
CREATE PROCEDURE update_participant_site_for_region_site(IN proc_region_site_id INT(10) UNSIGNED)
BEGIN

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
  LEFT JOIN region ON address.region_id = region.id
  LEFT JOIN region_site ON region.id = region_site.region_id
  AND region_site.site_id IN ( SELECT id FROM site WHERE application_id = application.id )
  LEFT JOIN site AS region_site_site ON region_site.site_id = region_site_site.id
  AND application.id = region_site_site.application_id
  AND IFNULL( participant.language_id, application.language_id ) = region_site.language_id
  LEFT JOIN application_has_participant ON application.id = application_has_participant.application_id
  AND application_has_participant.participant_id = participant.id
  WHERE region_site.id = proc_region_site_id;

END$$

DELIMITER ;

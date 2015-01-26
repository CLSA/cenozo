SELECT "Replacing old participant_site view" AS "";

CREATE OR REPLACE VIEW participant_site AS
SELECT application.id AS application_id,
       participant.id AS participant_id,
       IF(
         ISNULL( application_has_participant.preferred_site_id ),
         IF(
           application_has_cohort.grouping = 'jurisdiction',
           jurisdiction.site_id,
           region_site.site_id
         ),
         application_has_participant.preferred_site_id
       ) AS site_id
FROM application
CROSS JOIN participant
JOIN application_has_cohort ON application.id = application_has_cohort.application_id
AND application_has_cohort.cohort_id = participant.cohort_id
LEFT JOIN participant_primary_address ON participant.id = participant_primary_address.participant_id
LEFT JOIN address ON participant_primary_address.address_id = address.id
LEFT JOIN jurisdiction ON address.postcode = jurisdiction.postcode
AND application.id = jurisdiction.application_id
LEFT JOIN region ON address.region_id = region.id
LEFT JOIN region_site ON region.id = region_site.region_id
AND application.id = region_site.application_id
AND IFNULL( participant.language_id, application.language_id ) = region_site.language_id
LEFT JOIN application_has_participant ON application.id = application_has_participant.application_id
AND application_has_participant.participant_id = participant.id;

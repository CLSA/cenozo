SELECT "Replacing old participant_site view" AS "";

CREATE OR REPLACE VIEW participant_site AS
SELECT service.id AS service_id,
       participant.id AS participant_id,
       IF(
         ISNULL( service_has_participant.preferred_site_id ),
         IF(
           service_has_cohort.grouping = 'jurisdiction',
           jurisdiction.site_id,
           region_site.site_id
         ),
         service_has_participant.preferred_site_id
       ) AS site_id
FROM service
CROSS JOIN participant
JOIN service_has_cohort ON service.id = service_has_cohort.service_id
AND service_has_cohort.cohort_id = participant.cohort_id
LEFT JOIN participant_primary_address ON participant.id = participant_primary_address.participant_id
LEFT JOIN address ON participant_primary_address.address_id = address.id
LEFT JOIN jurisdiction ON address.postcode = jurisdiction.postcode
AND service.id = jurisdiction.service_id
LEFT JOIN region ON address.region_id = region.id
LEFT JOIN region_site ON region.id = region_site.region_id
AND service.id = region_site.service_id
AND IFNULL( participant.language_id, service.language_id ) = region_site.language_id
LEFT JOIN service_has_participant ON service.id = service_has_participant.service_id
AND service_has_participant.participant_id = participant.id;

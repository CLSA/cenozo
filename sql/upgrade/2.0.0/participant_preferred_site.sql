SELECT "Replacing old participant_site view" AS "";

DROP TABLE IF EXISTS participant_preferred_site;
CREATE OR REPLACE VIEW participant_preferred_site AS
SELECT application.id AS application_id,
       participant.id AS participant_id,
       application_has_participant.preferred_site_id site_id
FROM application
CROSS JOIN participant
JOIN application_has_cohort ON application.id = application_has_cohort.application_id
AND application_has_cohort.cohort_id = participant.cohort_id
LEFT JOIN application_has_participant ON application.id = application_has_participant.application_id
AND application_has_participant.participant_id = participant.id;

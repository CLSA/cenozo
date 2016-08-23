SELECT "Creating new update_participant_last_consents procedure" AS "";

DROP PROCEDURE IF EXISTS update_participant_last_written_consents;

DELIMITER $$
CREATE PROCEDURE update_participant_last_written_consents(IN proc_participant_id INT(10) UNSIGNED)
BEGIN
  REPLACE INTO participant_last_written_consents( participant_id, consent_type_id, consent_id )
  SELECT participant.id, consent_type.id, consent.id
  FROM participant
  CROSS JOIN consent_type
  LEFT JOIN consent ON participant.id = consent.participant_id
  AND consent_type.id = consent.consent_type_id
  AND consent.datetime <=> (
    SELECT MAX( datetime )
    FROM consent
    WHERE consent.written = true
    AND participant.id = consent.participant_id
    AND consent_type.id = consent.consent_type_id
    GROUP BY consent.participant_id, consent.consent_type_id
    LIMIT 1
  )
  WHERE participant.id = proc_participant_id;
END$$

DELIMITER ;

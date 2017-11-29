DROP procedure IF EXISTS get_hold_from_consent;

DELIMITER $$
CREATE PROCEDURE get_hold_from_consent (IN proc_consent_id INT(10) UNSIGNED, OUT proc_hold_id INT(10) UNSIGNED)
BEGIN
  SELECT hold.id INTO proc_hold_id
  FROM consent
  JOIN consent_type ON consent.consent_type_id = consent_type.id
  LEFT JOIN hold ON consent.datetime = hold.datetime
   AND hold.participant_id = consent.participant_id
  WHERE consent_type.name = "participation"
  AND consent.id = proc_consent_id;
END$$

DELIMITER ;

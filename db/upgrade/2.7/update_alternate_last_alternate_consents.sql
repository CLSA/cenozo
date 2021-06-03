SELECT "Creating new update_alternate_last_alternate_consents procedure" AS "";

DROP PROCEDURE IF EXISTS update_alternate_last_alternate_consents;

DELIMITER $$

CREATE PROCEDURE update_alternate_last_alternate_consents (IN proc_alternate_id INT(10) UNSIGNED)
BEGIN
  REPLACE INTO alternate_last_alternate_consent( alternate_id, alternate_consent_type_id, alternate_consent_id )
  SELECT alternate.id, alternate_consent_type.id, alternate_consent.id
  FROM alternate
  CROSS JOIN alternate_consent_type
  LEFT JOIN alternate_consent ON alternate.id = alternate_consent.alternate_id
  AND alternate_consent_type.id = alternate_consent.alternate_consent_type_id
  AND alternate_consent.datetime <=> (
    SELECT MAX( datetime )
    FROM alternate_consent
    WHERE alternate.id = alternate_consent.alternate_id
    AND alternate_consent_type.id = alternate_consent.alternate_consent_type_id
    GROUP BY alternate_consent.alternate_id, alternate_consent.alternate_consent_type_id
    LIMIT 1
  )
  WHERE alternate.id = proc_alternate_id;
END$$

DELIMITER ;

SELECT "Adding trigger to alternate_consent_type table" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS alternate_consent_type_AFTER_INSERT;

CREATE DEFINER=CURRENT_USER TRIGGER alternate_consent_type_AFTER_INSERT AFTER INSERT ON alternate_consent_type FOR EACH ROW
BEGIN
  INSERT INTO alternate_last_alternate_consent( alternate_id, alternate_consent_type_id, alternate_consent_id )
  SELECT alternate.id, NEW.id, NULL
  FROM alternate;
  INSERT INTO alternate_last_written_alternate_consent( alternate_id, alternate_consent_type_id, alternate_consent_id )
  SELECT alternate.id, NEW.id, NULL
  FROM alternate;
END$$

DELIMITER ;

CREATE TRIGGER alternate_consent_type_AFTER_INSERT AFTER INSERT ON alternate_consent_type FOR EACH ROW
BEGIN
  INSERT INTO alternate_last_alternate_consent( alternate_id, alternate_consent_type_id, alternate_consent_id )
  SELECT alternate.id, NEW.id, NULL
  FROM alternate;
  INSERT INTO alternate_last_written_alternate_consent( alternate_id, alternate_consent_type_id, alternate_consent_id )
  SELECT alternate.id, NEW.id, NULL
  FROM alternate;
END ;;

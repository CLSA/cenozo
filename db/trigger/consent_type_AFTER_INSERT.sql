CREATE TRIGGER consent_type_AFTER_INSERT AFTER INSERT ON consent_type FOR EACH ROW
BEGIN
  INSERT INTO participant_last_consent( participant_id, consent_type_id, consent_id )
  SELECT participant.id, NEW.id, NULL
  FROM participant;
  INSERT INTO participant_last_written_consent( participant_id, consent_type_id, consent_id )
  SELECT participant.id, NEW.id, NULL
  FROM participant;
END ;;
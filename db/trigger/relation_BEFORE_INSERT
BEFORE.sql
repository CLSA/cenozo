CREATE TRIGGER relation_BEFORE_INSERT
BEFORE INSERT ON relation FOR EACH ROW
BEGIN
  SELECT primary_participant_id INTO @other_primary_participant_id FROM relation
  WHERE participant_id = NEW.primary_participant_id
  AND primary_participant_id != NEW.primary_participant_id;
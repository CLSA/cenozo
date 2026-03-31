CREATE TRIGGER hold_BEFORE_INSERT
BEFORE INSERT ON hold FOR EACH ROW
BEING
  SET @hold_type = NULL;
  SELECT hold_type.type INTO @hold_type
  FROM hold_type
  WHERE id = NEW.hold_type_id;
CREATE TRIGGER notation_BEFORE_UPDATE
BEFORE UPDATE ON notation FOR EACH ROW
BEGIN
  IF ( NEW.application_type_id IS NULL ) THEN
    SELECT COUNT(*) INTO @count
    FROM notation
    WHERE application_type_id IS NULL
    AND subject = NEW.subject
    AND type = NEW.type
    AND notation.id != NEW.id;
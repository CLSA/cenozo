CREATE TRIGGER alternate_BEFORE_INSERT
BEFORE INSERT ON alternate FOR EACH ROW
BEGIN
  IF NOT NEW.language_id THEN
    SET NEW.language_id = ( SELECT language_id FROM participant WHERE id = NEW.participant_id );
  END IF;
END$$
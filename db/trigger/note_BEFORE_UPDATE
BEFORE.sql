CREATE TRIGGER note_BEFORE_UPDATE
BEFORE UPDATE ON note FOR EACH ROW
BEGIN
  IF ( NEW.alternate_id IS NULL AND NEW.participant_id IS NULL ) or 
     ( NEW.alternate_id IS NOT NULL AND NEW.participant_id IS NOT NULL ) THEN
    SIGNAL SQLSTATE '23000'
    SET MESSAGE_TEXT = "Either column 'alternate_id' or 'participant_id' cannot be null",
    MYSQL_ERRNO = 1048;
  END IF;
END$$
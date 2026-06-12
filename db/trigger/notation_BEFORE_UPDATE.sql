CREATE TRIGGER notation_BEFORE_UPDATE BEFORE UPDATE ON notation FOR EACH ROW
BEGIN
  IF ( NEW.application_type_id IS NULL ) THEN
    SELECT COUNT(*) INTO @count
    FROM notation
    WHERE application_type_id IS NULL
    AND subject = NEW.subject
    AND type = NEW.type
    AND notation.id != NEW.id;

    IF ( @count ) THEN
      SET @sql = CONCAT(
        "Duplicate entry 'NULL-",
        NEW.subject,
        "-",
        NEW.type,
        "' for key 'uq_application_type_id_subject_type'"
      );
      SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = @sql, MYSQL_ERRNO = 1062;
    END IF;
  END IF;
END ;;

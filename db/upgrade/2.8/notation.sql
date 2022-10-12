SELECT "Creating new notation table" AS "";

CREATE TABLE IF NOT EXISTS notation (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  application_type_id INT(10) UNSIGNED NULL DEFAULT NULL,
  subject VARCHAR(45) NOT NULL,
  type VARCHAR(45) NOT NULL,
  description VARCHAR(45) NULL,
  PRIMARY KEY (id),
  INDEX fk_application_type_id (application_type_id ASC),
  UNIQUE INDEX uq_application_type_id_subject_type (application_type_id ASC, subject ASC, type ASC),
  CONSTRAINT fk_notation_application_type_id
    FOREIGN KEY (application_type_id)
    REFERENCES application_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

DELIMITER $$

DROP TRIGGER IF EXISTS notation_BEFORE_INSERT$$
CREATE DEFINER = CURRENT_USER TRIGGER notation_BEFORE_INSERT BEFORE INSERT ON notation FOR EACH ROW
BEGIN
  IF ( NEW.application_type_id IS NULL ) THEN
    SELECT COUNT(*) INTO @count
    FROM notation
    WHERE application_type_id IS NULL
    AND subject = NEW.subject
    AND type = NEW.type;

    IF ( @count ) THEN
      SET @sql = CONCAT(
        "Duplicate entry 'NULL-",
        NEW.subject,
        "-",
        NEW.type,
        "' for key 'uq_alternate_id_participant_id_rank'"
      );
      SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = @sql, MYSQL_ERRNO = 1062;
    END IF;
  END IF;
END$$

DROP TRIGGER IF EXISTS notation_BEFORE_UPDATE$$
CREATE DEFINER = CURRENT_USER TRIGGER notation_BEFORE_UPDATE BEFORE UPDATE ON notation FOR EACH ROW
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
        "' for key 'uq_alternate_id_participant_id_rank'"
      );
      SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = @sql, MYSQL_ERRNO = 1062;
    END IF;
  END IF;
END$$

DELIMITER ;

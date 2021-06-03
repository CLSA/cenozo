SELECT "Creating new alternate_consent table" AS "";

CREATE TABLE IF NOT EXISTS alternate_consent (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  alternate_id INT(10) UNSIGNED NOT NULL,
  alternate_consent_type_id INT(10) UNSIGNED NOT NULL,
  accept TINYINT(1) NOT NULL,
  written TINYINT(1) NOT NULL,
  datetime DATETIME NOT NULL,
  note TEXT NULL,
  PRIMARY KEY (id),
  INDEX fk_alternate_id (alternate_id ASC),
  INDEX fk_alternate_consent_type_id (alternate_consent_type_id ASC),
  INDEX dk_datetime (datetime ASC),
  CONSTRAINT fk_alternate_consent_alternate_id
    FOREIGN KEY (alternate_id)
    REFERENCES alternate (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_alternate_consent_alternate_consent_type_id
    FOREIGN KEY (alternate_consent_type_id)
    REFERENCES alternate_consent_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


DELIMITER $$

DROP TRIGGER IF EXISTS alternate_consent_AFTER_INSERT;
CREATE DEFINER = CURRENT_USER TRIGGER alternate_consent_AFTER_INSERT AFTER INSERT ON alternate_consent FOR EACH ROW
BEGIN
  CALL update_alternate_last_alternate_consent( NEW.alternate_id, NEW.alternate_consent_type_id );
  CALL update_alternate_last_written_alternate_consent( NEW.alternate_id, NEW.alternate_consent_type_id );
END$$

DROP TRIGGER IF EXISTS alternate_consent_AFTER_UPDATE;
CREATE DEFINER = CURRENT_USER TRIGGER alternate_consent_AFTER_UPDATE AFTER UPDATE ON alternate_consent FOR EACH ROW
BEGIN
  CALL update_alternate_last_alternate_consent( NEW.alternate_id, NEW.alternate_consent_type_id );
  CALL update_alternate_last_written_alternate_consent( NEW.alternate_id, NEW.alternate_consent_type_id );
END$$

DROP TRIGGER IF EXISTS alternate_consent_AFTER_DELETE;
CREATE DEFINER = CURRENT_USER TRIGGER alternate_consent_AFTER_DELETE AFTER DELETE ON alternate_consent FOR EACH ROW
BEGIN
  CALL update_alternate_last_alternate_consent( OLD.alternate_id, OLD.alternate_consent_type_id );
  CALL update_alternate_last_written_alternate_consent( OLD.alternate_id, OLD.alternate_consent_type_id );
END$$

DELIMITER ;

SELECT "Create new equipment_loan table" AS "";

CREATE TABLE IF NOT EXISTS equipment_loan (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  participant_id INT(10) UNSIGNED NOT NULL,
  equipment_id INT UNSIGNED NOT NULL,
  lost TINYINT(1) NOT NULL DEFAULT 0,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NULL DEFAULT NULL,
  note TEXT NULL,
  PRIMARY KEY (id),
  INDEX fk_participant_id (participant_id ASC),
  INDEX fk_equipment_id (equipment_id ASC),
  CONSTRAINT fk_equipment_loan_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_equipment_loan_equipment_id
    FOREIGN KEY (equipment_id)
    REFERENCES equipment (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


DELIMITER $$

DROP TRIGGER IF EXISTS equipment_loan_AFTER_INSERT$$
CREATE DEFINER = CURRENT_USER TRIGGER equipment_loan_AFTER_INSERT AFTER INSERT ON equipment_loan FOR EACH ROW
BEGIN
  CALL update_equipment_last_loan( NEW.equipment_id );
END$$

DROP TRIGGER IF EXISTS equipment_loan_AFTER_UPDATE$$
CREATE DEFINER = CURRENT_USER TRIGGER equipment_loan_AFTER_UPDATE AFTER UPDATE ON equipment_loan FOR EACH ROW
BEGIN
  CALL update_equipment_last_loan( NEW.equipment_id );
END$$

DROP TRIGGER IF EXISTS equipment_loan_AFTER_DELETE$$
CREATE DEFINER = CURRENT_USER TRIGGER equipment_loan_AFTER_DELETE AFTER DELETE ON equipment_loan FOR EACH ROW
BEGIN
  CALL update_equipment_last_loan( OLD.equipment_id );
END$$

DROP TRIGGER IF EXISTS equipment_loan_BEFORE_UPDATE$$
CREATE DEFINER = CURRENT_USER TRIGGER equipment_loan_BEFORE_UPDATE BEFORE UPDATE ON equipment_loan FOR EACH ROW
BEGIN
  IF( NEW.lost AND NEW.end_datetime IS NULL AND OLD.end_datetime IS NULL ) THEN
    SET NEW.end_datetime = UTC_TIMESTAMP();
  END IF;
END$$


DELIMITER ;

SELECT "Create new equipment_loan table" AS "";

CREATE TABLE IF NOT EXISTS equipment_loan (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  participant_id INT(10) UNSIGNED NOT NULL,
  equipment_id INT UNSIGNED NOT NULL,
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

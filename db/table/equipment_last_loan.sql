CREATE TABLE equipment_last_loan (
  equipment_id INT UNSIGNED NOT NULL,
  equipment_loan_id INT UNSIGNED NULL DEFAULT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (equipment_id),
  INDEX fk_equipment_loan_id (equipment_loan_id ASC),
  CONSTRAINT fk_equipment_last_loan_equipment_id
    FOREIGN KEY (equipment_id)
    REFERENCES equipment (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_equipment_last_loan_equipment_loan_id
    FOREIGN KEY (equipment_loan_id)
    REFERENCES equipment_loan (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

SELECT "Create new equipment table" AS "";

CREATE TABLE IF NOT EXISTS equipment (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  equipment_type_id INT UNSIGNED NOT NULL,
  serial_number VARCHAR(45) NOT NULL,
  note TEXT NULL,
  PRIMARY KEY (id),
  INDEX fk_equipment_type_id (equipment_type_id ASC),
  UNIQUE INDEX uq_serial_number (serial_number ASC),
  CONSTRAINT fk_equipment_equipment_type_id
    FOREIGN KEY (equipment_type_id)
    REFERENCES equipment_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

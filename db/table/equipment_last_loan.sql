CREATE TABLE equipment_last_loan (
  equipment_id int(10) unsigned NOT NULL,
  equipment_loan_id int(10) unsigned DEFAULT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (equipment_id),
  KEY fk_equipment_loan_id (equipment_loan_id),
  CONSTRAINT fk_equipment_last_loan_equipment_id
    FOREIGN KEY (equipment_id)
    REFERENCES equipment (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_equipment_last_loan_equipment_loan_id
    FOREIGN KEY (equipment_loan_id)
    REFERENCES equipment_loan (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

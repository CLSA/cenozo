CREATE TABLE equipment_loan (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  participant_id int(10) unsigned NOT NULL,
  equipment_id int(10) unsigned NOT NULL,
  lost tinyint(1) NOT NULL DEFAULT 0,
  start_datetime datetime NOT NULL,
  end_datetime datetime DEFAULT NULL,
  note text DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_participant_id_equipment_id_start_datetime (participant_id,equipment_id,start_datetime),
  KEY fk_participant_id (participant_id),
  KEY fk_equipment_id (equipment_id),
  CONSTRAINT fk_equipment_loan_equipment_id
    FOREIGN KEY (equipment_id)
    REFERENCES equipment (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_equipment_loan_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE form (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  participant_id int(10) unsigned NOT NULL,
  form_type_id int(10) unsigned NOT NULL,
  date date NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_participant_id_form_type_id_date (participant_id,form_type_id,date),
  KEY fk_participant_id (participant_id),
  KEY fk_form_type_id (form_type_id),
  CONSTRAINT fk_form_form_type_id
    FOREIGN KEY (form_type_id)
    REFERENCES form_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_form_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

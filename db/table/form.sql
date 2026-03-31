CREATE TABLE form (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  participant_id INT(10) UNSIGNED NOT NULL,
  form_type_id INT(10) UNSIGNED NOT NULL,
  date DATE NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_participant_id_form_type_id_date (participant_id ASC, form_type_id ASC, date ASC),
  INDEX fk_participant_id (participant_id ASC),
  INDEX fk_form_type_id (form_type_id ASC),
  CONSTRAINT fk_form_form_type_id
    FOREIGN KEY (form_type_id)
    REFERENCES form_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_form_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

CREATE TABLE form_association (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  form_id INT(10) UNSIGNED NOT NULL,
  subject VARCHAR(45) NOT NULL,
  record_id INT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_form_id_subject_record_id (form_id ASC, subject ASC, record_id ASC),
  INDEX fk_form_id (form_id ASC),
  INDEX dk_record_id (record_id ASC),
  CONSTRAINT fk_form_association_form_id
    FOREIGN KEY (form_id)
    REFERENCES form (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

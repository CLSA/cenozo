CREATE TABLE IF NOT EXISTS form_association (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  form_id INT UNSIGNED NOT NULL,
  subject VARCHAR(45) NOT NULL,
  record_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_form_id (form_id ASC),
  INDEX dk_record_id (record_id ASC),
  UNIQUE INDEX uq_form_id_subject_record_id (form_id ASC, subject ASC, record_id ASC),
  CONSTRAINT fk_form_association_form_id
    FOREIGN KEY (form_id)
    REFERENCES form (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

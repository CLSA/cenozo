CREATE TABLE notation (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  application_type_id INT(10) UNSIGNED NULL DEFAULT NULL,
  subject VARCHAR(45) NOT NULL,
  type VARCHAR(45) NOT NULL,
  description TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  INDEX fk_application_type_id (application_type_id ASC),
  UNIQUE INDEX uq_application_type_id_subject_type (application_type_id ASC, subject ASC, type ASC),
  CONSTRAINT fk_notation_application_type_id
    FOREIGN KEY (application_type_id)
    REFERENCES application_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE alternate_type (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  name VARCHAR(45) NOT NULL,
  title VARCHAR(255) NOT NULL,
  alternate_consent_type_id INT(10) UNSIGNED NULL DEFAULT NULL,
  description TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC),
  UNIQUE INDEX uq_title (title ASC),
  INDEX fk_alternate_consent_type_id (alternate_consent_type_id ASC),
  CONSTRAINT fk_alternate_type_alternate_consent_type_id
    FOREIGN KEY (alternate_consent_type_id)
    REFERENCES alternate_consent_type (id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

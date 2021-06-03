SELECT "Creating new role_has_alternate_consent_type table" AS "";

CREATE TABLE IF NOT EXISTS role_has_alternate_consent_type (
  role_id INT(10) UNSIGNED NOT NULL,
  alternate_consent_type_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  PRIMARY KEY (role_id, alternate_consent_type_id),
  INDEX fk_alternate_consent_type_id (alternate_consent_type_id ASC),
  INDEX fk_role_id (role_id ASC),
  CONSTRAINT fk_role_has_alternate_consent_type_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_role_has_alternate_consent_type_alternate_consent_type_id
    FOREIGN KEY (alternate_consent_type_id)
    REFERENCES alternate_consent_type (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE role_has_consent_type (
  role_id INT(10) UNSIGNED NOT NULL,
  consent_type_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (role_id, consent_type_id),
  INDEX fk_consent_type_id (consent_type_id ASC),
  INDEX fk_role_id (role_id ASC),
  CONSTRAINT fk_role_has_consent_type_consent_type_id
    FOREIGN KEY (consent_type_id)
    REFERENCES consent_type (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_role_has_consent_type_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

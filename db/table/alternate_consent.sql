CREATE TABLE alternate_consent (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  alternate_id INT(10) UNSIGNED NOT NULL,
  alternate_consent_type_id INT(10) UNSIGNED NOT NULL,
  accept TINYINT(1) NOT NULL,
  written TINYINT(1) NOT NULL,
  datetime DATETIME NOT NULL,
  note TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  INDEX fk_alternate_id (alternate_id ASC),
  INDEX dk_datetime (datetime ASC),
  INDEX fk_alternate_consent_alternate_consent_type_id_idx (alternate_consent_type_id ASC),
  CONSTRAINT fk_alternate_consent_alternate_id
    FOREIGN KEY (alternate_id)
    REFERENCES alternate (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_alternate_consent_alternate_consent_type_id
    FOREIGN KEY (alternate_consent_type_id)
    REFERENCES alternate_consent_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

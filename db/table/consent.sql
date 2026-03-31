CREATE TABLE consent (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  participant_id INT(10) UNSIGNED NOT NULL,
  consent_type_id INT(10) UNSIGNED NOT NULL,
  accept TINYINT(1) NOT NULL,
  written TINYINT(1) NOT NULL DEFAULT 0,
  datetime DATETIME NOT NULL,
  note TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  INDEX fk_participant_id (participant_id ASC),
  INDEX dk_date (datetime ASC),
  INDEX fk_consent_type_id (consent_type_id ASC),
  CONSTRAINT fk_consent_consent_type_id
    FOREIGN KEY (consent_type_id)
    REFERENCES consent_type (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_consent_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

CREATE TABLE participant_last_consent (
  participant_id INT(10) UNSIGNED NOT NULL,
  consent_type_id INT(10) UNSIGNED NOT NULL DEFAULT 0,
  consent_id INT(10) UNSIGNED NULL DEFAULT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (participant_id, consent_type_id),
  INDEX fk_consent_id (consent_id ASC),
  INDEX fk_participant_last_consent_consent_type_id (consent_type_id ASC),
  CONSTRAINT fk_participant_last_consent_consent_id
    FOREIGN KEY (consent_id)
    REFERENCES consent (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_participant_last_consent_consent_type_id
    FOREIGN KEY (consent_type_id)
    REFERENCES consent_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_participant_last_consent_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

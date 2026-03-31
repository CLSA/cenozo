CREATE TABLE study (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  name VARCHAR(45) NOT NULL,
  consent_type_id INT(10) UNSIGNED NULL DEFAULT NULL,
  completed_event_type_id INT(10) UNSIGNED NULL DEFAULT NULL,
  description TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC),
  INDEX fk_consent_type_id (consent_type_id ASC),
  INDEX fk_completed_event_type_id (completed_event_type_id ASC),
  CONSTRAINT fk_study_completed_event_type_id
    FOREIGN KEY (completed_event_type_id)
    REFERENCES event_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_study_consent_type_id
    FOREIGN KEY (consent_type_id)
    REFERENCES consent_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

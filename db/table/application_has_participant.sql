CREATE TABLE application_has_participant (
  application_id INT(10) UNSIGNED NOT NULL,
  participant_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  preferred_site_id INT(10) UNSIGNED NULL DEFAULT NULL,
  datetime DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (application_id, participant_id),
  INDEX fk_participant_id (participant_id ASC),
  INDEX fk_preferred_site_id (preferred_site_id ASC),
  INDEX fk_application_id (application_id ASC),
  CONSTRAINT fk_application_has_participant_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_application_has_participant_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_application_has_participant_preferred_site_id
    FOREIGN KEY (preferred_site_id)
    REFERENCES site (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

CREATE TABLE participant_site (
  application_id INT(10) UNSIGNED NOT NULL,
  participant_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  site_id INT(10) UNSIGNED NULL DEFAULT NULL,
  default_site_id INT(10) UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (application_id, participant_id),
  INDEX fk_application_id (application_id ASC),
  INDEX fk_participant_id (participant_id ASC),
  INDEX fk_site_id (site_id ASC),
  INDEX fk_default_site_id (default_site_id ASC),
  CONSTRAINT fk_participant_site_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_participant_site_default_site_id
    FOREIGN KEY (default_site_id)
    REFERENCES site (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_participant_site_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_participant_site_site_id
    FOREIGN KEY (site_id)
    REFERENCES site (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

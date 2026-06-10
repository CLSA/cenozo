CREATE TABLE application_has_participant (
  application_id int(10) unsigned NOT NULL,
  participant_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  preferred_site_id int(10) unsigned DEFAULT NULL,
  datetime datetime DEFAULT NULL,
  PRIMARY KEY (application_id,participant_id),
  KEY fk_participant_id (participant_id),
  KEY fk_preferred_site_id (preferred_site_id),
  KEY fk_application_id (application_id),
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
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
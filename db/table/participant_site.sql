CREATE TABLE participant_site (
  application_id int(10) unsigned NOT NULL,
  participant_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  site_id int(10) unsigned DEFAULT NULL,
  default_site_id int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (application_id,participant_id),
  KEY fk_application_id (application_id),
  KEY fk_participant_id (participant_id),
  KEY fk_site_id (site_id),
  KEY fk_default_site_id (default_site_id),
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
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE consent (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  participant_id int(10) unsigned NOT NULL,
  consent_type_id int(10) unsigned NOT NULL,
  accept tinyint(1) NOT NULL,
  written tinyint(1) NOT NULL DEFAULT 0,
  datetime datetime NOT NULL,
  note mediumtext DEFAULT NULL,
  PRIMARY KEY (id),
  KEY fk_participant_id (participant_id),
  KEY dk_date (datetime),
  KEY fk_consent_type_id (consent_type_id),
  KEY dk_participant_id_datetime (participant_id,datetime),
  CONSTRAINT fk_consent_consent_type_id
    FOREIGN KEY (consent_type_id)
    REFERENCES consent_type (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_consent_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE participant_last_written_consent (
  participant_id int(10) unsigned NOT NULL,
  consent_type_id int(10) unsigned NOT NULL DEFAULT 0,
  consent_id int(10) unsigned DEFAULT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (participant_id,consent_type_id),
  KEY fk_consent_id (consent_id),
  KEY fk_participant_last_written_consent_consent_type_id (consent_type_id),
  CONSTRAINT fk_participant_last_written_consent_consent_id
    FOREIGN KEY (consent_id)
    REFERENCES consent (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_participant_last_written_consent_consent_type_id
    FOREIGN KEY (consent_type_id)
    REFERENCES consent_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_participant_last_written_consent_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
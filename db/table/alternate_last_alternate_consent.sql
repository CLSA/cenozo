CREATE TABLE alternate_last_alternate_consent (
  alternate_id int(10) unsigned NOT NULL,
  alternate_consent_type_id int(10) unsigned NOT NULL,
  alternate_consent_id int(10) unsigned DEFAULT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (alternate_id,alternate_consent_type_id),
  KEY fk_alternate_consent_type_id (alternate_consent_type_id),
  KEY fk_alternate_consent_id (alternate_consent_id),
  CONSTRAINT fk_alternate_last_alternate_consent_alternate_consent_id
    FOREIGN KEY (alternate_consent_id)
    REFERENCES alternate_consent (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_alternate_last_alternate_consent_alternate_consent_type_id
    FOREIGN KEY (alternate_consent_type_id)
    REFERENCES alternate_consent_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_alternate_last_alternate_consent_alternate_id
    FOREIGN KEY (alternate_id)
    REFERENCES alternate (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

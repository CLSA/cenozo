CREATE TABLE alternate_consent (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  alternate_id int(10) unsigned NOT NULL,
  alternate_consent_type_id int(10) unsigned NOT NULL,
  accept tinyint(1) NOT NULL,
  written tinyint(1) NOT NULL,
  datetime datetime NOT NULL,
  note mediumtext DEFAULT NULL,
  PRIMARY KEY (id),
  KEY fk_alternate_id (alternate_id),
  KEY fk_alternate_consent_type_id (alternate_consent_type_id),
  KEY dk_datetime (datetime),
  CONSTRAINT fk_alternate_consent_alternate_consent_type_id
    FOREIGN KEY (alternate_consent_type_id)
    REFERENCES alternate_consent_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_alternate_consent_alternate_id
    FOREIGN KEY (alternate_id)
    REFERENCES alternate (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

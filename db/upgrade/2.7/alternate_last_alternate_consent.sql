SELECT "Creating new alternate_last_alternate_consent table" AS "";

CREATE TABLE IF NOT EXISTS alternate_last_alternate_consent (
  alternate_id INT(10) UNSIGNED NOT NULL,
  alternate_consent_type_id INT(10) UNSIGNED NOT NULL,
  alternate_consent_id INT(10) UNSIGNED NULL DEFAULT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  PRIMARY KEY (alternate_id, alternate_consent_type_id),
  INDEX fk_alternate_consent_type_id (alternate_consent_type_id ASC),
  INDEX fk_alternate_consent_id (alternate_consent_id ASC),
  CONSTRAINT fk_alternate_last_alternate_consent_alternate_id
    FOREIGN KEY (alternate_id)
    REFERENCES alternate (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_alternate_last_alternate_consent_alternate_consent_type_id
    FOREIGN KEY (alternate_consent_type_id)
    REFERENCES alternate_consent_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_alternate_last_alternate_consent_alternate_consent_id
    FOREIGN KEY (alternate_consent_id)
    REFERENCES alternate_consent (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB;

INSERT IGNORE INTO alternate_last_alternate_consent( alternate_id, alternate_consent_type_id, alternate_consent_id )
SELECT alternate.id, alternate_consent_type.id, NULL
FROM alternate, alternate_consent_type;

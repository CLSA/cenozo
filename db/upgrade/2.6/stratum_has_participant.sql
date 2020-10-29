SELECT "Creating new stratum_has_participant table" AS "";

CREATE TABLE IF NOT EXISTS stratum_has_participant (
  stratum_id INT UNSIGNED NOT NULL,
  participant_id INT UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  PRIMARY KEY (stratum_id, participant_id),
  INDEX fk_participant_id (participant_id ASC),
  INDEX fk_stratum_id (stratum_id ASC),
  CONSTRAINT fk_stratum_has_participant_stratum_id
    FOREIGN KEY (stratum_id)
    REFERENCES stratum (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_stratum_has_participant_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

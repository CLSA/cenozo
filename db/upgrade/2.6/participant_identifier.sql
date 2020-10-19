SELECT "Creating new participant_identifier table" AS "";

CREATE TABLE IF NOT EXISTS participant_identifier (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  identifier_id INT UNSIGNED NOT NULL,
  participant_id INT UNSIGNED NOT NULL,
  value VARCHAR(45) NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_identifier_id (identifier_id ASC),
  INDEX fk_participant_id (participant_id ASC),
  UNIQUE INDEX uq_identifier_id_participant_id (identifier_id ASC, participant_id ASC),
  UNIQUE INDEX uq_identifier_id_value (identifier_id ASC, value ASC),
  CONSTRAINT fk_participant_identifier_identifier_id
    FOREIGN KEY (identifier_id)
    REFERENCES identifier (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_participant_identifier_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

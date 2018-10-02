SELECT "Creating new supporting_script_check table" AS "";

CREATE TABLE IF NOT EXISTS supporting_script_check (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  participant_id INT UNSIGNED NOT NULL,
  script_id INT UNSIGNED NOT NULL,
  datetime DATETIME NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_participant_id (participant_id ASC),
  INDEX fk_script_id (script_id ASC),
  INDEX dk_datetime (datetime ASC),
  UNIQUE INDEX uq_participant_id_script_id (participant_id ASC, script_id ASC),
  CONSTRAINT fk_supporting_script_check_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_supporting_script_check_script_id
    FOREIGN KEY (script_id)
    REFERENCES script (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

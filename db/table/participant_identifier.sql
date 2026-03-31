CREATE TABLE participant_identifier (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  identifier_id INT(10) UNSIGNED NOT NULL,
  participant_id INT(10) UNSIGNED NOT NULL,
  value VARCHAR(45) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_identifier_id_participant_id (identifier_id ASC, participant_id ASC),
  UNIQUE INDEX uq_identifier_id_value (identifier_id ASC, value ASC),
  INDEX fk_identifier_id (identifier_id ASC),
  INDEX fk_participant_id (participant_id ASC),
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
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

CREATE TABLE variable_cache (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  participant_id INT(10) UNSIGNED NOT NULL,
  variable VARCHAR(255) NOT NULL,
  value VARCHAR(255) NULL DEFAULT NULL,
  expiry DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_participant_id_variable (participant_id ASC, variable ASC),
  INDEX fk_participant_id (participant_id ASC),
  INDEX dk_variable (variable ASC),
  CONSTRAINT fk_variable_cache_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

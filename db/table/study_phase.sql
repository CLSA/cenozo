CREATE TABLE study_phase (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  study_id INT(10) UNSIGNED NOT NULL,
  rank INT(10) UNSIGNED NOT NULL,
  code CHAR(2) NOT NULL,
  name VARCHAR(45) NOT NULL,
  identifier_id INT(10) UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_study_id_rank (study_id ASC, rank ASC),
  UNIQUE INDEX uq_study_id_code (study_id ASC, code ASC),
  UNIQUE INDEX uq_study_id_name (study_id ASC, name ASC),
  INDEX fk_study_id (study_id ASC),
  INDEX fk_identifier_id (identifier_id ASC),
  CONSTRAINT fk_study_phase_study_id
    FOREIGN KEY (study_id)
    REFERENCES study (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_study_phase_identifier_id
    FOREIGN KEY (identifier_id)
    REFERENCES identifier (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

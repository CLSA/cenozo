SELECT "Creating new stratum table" AS "";

CREATE TABLE IF NOT EXISTS stratum (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  study_id INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  PRIMARY KEY (id),
  INDEX fk_study_id (study_id ASC),
  UNIQUE INDEX uq_study_id_name (study_id ASC, name ASC),
  CONSTRAINT fk_stratum_study_id
    FOREIGN KEY (study_id)
    REFERENCES study (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

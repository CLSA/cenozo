SELECT "Creating new search_result table" AS "";

CREATE TABLE IF NOT EXISTS search_result (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  search_id INT UNSIGNED NOT NULL,
  participant_id INT UNSIGNED NOT NULL,
  record_id INT UNSIGNED NOT NULL,
  subject VARCHAR(64) NOT NULL,
  column_name VARCHAR(64) NOT NULL,
  value VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_participant_id (participant_id ASC),
  INDEX fk_search_id (search_id ASC),
  UNIQUE INDEX uq_search_id_participant_id_subject_column_name (search_id ASC, participant_id ASC, subject ASC, column_name ASC),
  UNIQUE INDEX uq_search_id_record_id_subject_column_name (search_id ASC, record_id ASC, subject ASC, column_name ASC),
  CONSTRAINT fk_search_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_search_result_search_id
    FOREIGN KEY (search_id)
    REFERENCES search (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

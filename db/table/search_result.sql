CREATE TABLE search_result (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  search_id INT(10) UNSIGNED NOT NULL,
  participant_id INT(10) UNSIGNED NOT NULL,
  record_id INT(10) UNSIGNED NOT NULL,
  subject VARCHAR(64) NOT NULL,
  column_name VARCHAR(64) NOT NULL,
  value VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_search_id_participant_id_subject_column_name (search_id ASC, participant_id ASC, subject ASC, column_name ASC),
  UNIQUE INDEX uq_search_id_record_id_subject_column_name (search_id ASC, record_id ASC, subject ASC, column_name ASC),
  INDEX fk_participant_id (participant_id ASC),
  INDEX fk_search_id (search_id ASC),
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
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

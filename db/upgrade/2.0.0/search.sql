SELECT "Creating new search table" AS "";

DROP TABLE IF EXISTS search ;
CREATE TABLE IF NOT EXISTS search (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  query VARCHAR(255) NOT NULL,
  participant_id INT UNSIGNED NOT NULL,
  datetime DATETIME NOT NULL,
  subject VARCHAR(64) NOT NULL,
  column_name VARCHAR(64) NOT NULL,
  record_id INT UNSIGNED NOT NULL,
  value VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_query_subject_record_id (query ASC, subject ASC, record_id ASC),
  INDEX dk_datetime (datetime ASC),
  INDEX dk_query (query ASC),
  INDEX fk_participant_id (participant_id ASC),
  CONSTRAINT fk_search_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE search_result (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  search_id int(10) unsigned NOT NULL,
  participant_id int(10) unsigned NOT NULL,
  record_id int(10) unsigned NOT NULL,
  subject varchar(64) NOT NULL,
  column_name varchar(64) NOT NULL,
  value varchar(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_search_id_participant_id_subject_column_name (search_id,participant_id,subject,column_name),
  UNIQUE KEY uq_search_id_record_id_subject_column_name (search_id,record_id,subject,column_name),
  KEY fk_participant_id (participant_id),
  KEY fk_search_id (search_id),
  CONSTRAINT fk_search_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_search_result_search_id
    FOREIGN KEY (search_id)
    REFERENCES search (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE script (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  name varchar(255) NOT NULL,
  started_event_type_id int(10) unsigned DEFAULT NULL,
  finished_event_type_id int(10) unsigned DEFAULT NULL,
  pine_qnaire_id int(10) unsigned DEFAULT NULL,
  repeated tinyint(1) NOT NULL DEFAULT 0,
  supporting tinyint(1) NOT NULL DEFAULT 0,
  total_pages int(10) unsigned DEFAULT NULL,
  description mediumtext DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_name (name),
  UNIQUE KEY uq_pine_qnaire_id (pine_qnaire_id),
  KEY fk_started_event_type_id (started_event_type_id),
  KEY fk_finished_event_type_id (finished_event_type_id),
  CONSTRAINT fk_script_finished_event_type_id
    FOREIGN KEY (finished_event_type_id)
    REFERENCES event_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_script_started_event_type_id
    FOREIGN KEY (started_event_type_id)
    REFERENCES event_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
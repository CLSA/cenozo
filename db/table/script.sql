CREATE TABLE script (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  name VARCHAR(255) NOT NULL,
  started_event_type_id INT(10) UNSIGNED NULL DEFAULT NULL,
  finished_event_type_id INT(10) UNSIGNED NULL DEFAULT NULL,
  pine_qnaire_id INT(10) UNSIGNED NULL DEFAULT NULL,
  repeated TINYINT(1) NOT NULL DEFAULT 0,
  supporting TINYINT(1) NOT NULL DEFAULT 0,
  total_pages INT UNSIGNED NULL DEFAULT NULL,
  description TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC),
  UNIQUE INDEX uq_pine_qnaire_id (pine_qnaire_id ASC),
  INDEX fk_started_event_type_id (started_event_type_id ASC),
  INDEX fk_finished_event_type_id (finished_event_type_id ASC),
  CONSTRAINT fk_script_finished_event_type_id
    FOREIGN KEY (finished_event_type_id)
    REFERENCES event_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_script_started_event_type_id
    FOREIGN KEY (started_event_type_id)
    REFERENCES event_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

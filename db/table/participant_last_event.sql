CREATE TABLE participant_last_event (
  participant_id INT(10) UNSIGNED NOT NULL,
  event_type_id INT(10) UNSIGNED NOT NULL,
  event_id INT(10) UNSIGNED NULL DEFAULT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (participant_id, event_type_id),
  INDEX fk_event_type_id (event_type_id ASC),
  INDEX fk_event_id (event_id ASC),
  CONSTRAINT fk_participant_last_event_event_id
    FOREIGN KEY (event_id)
    REFERENCES event (id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION,
  CONSTRAINT fk_participant_last_event_event_type_id
    FOREIGN KEY (event_type_id)
    REFERENCES event_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_participant_last_event_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

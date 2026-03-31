CREATE TABLE participant_last_trace (
  participant_id INT(10) UNSIGNED NOT NULL,
  trace_id INT(10) UNSIGNED NULL DEFAULT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (participant_id),
  INDEX fk_trace_id (trace_id ASC),
  CONSTRAINT fk_participant_last_trace_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_participant_last_trace_trace_id
    FOREIGN KEY (trace_id)
    REFERENCES trace (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

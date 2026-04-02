SELECT "Creating new trace_has_mail table" AS "";

CREATE TABLE IF NOT EXISTS trace_has_mail (
  trace_id INT(10) UNSIGNED NOT NULL,
  mail_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (trace_id, mail_id),
  UNIQUE INDEX uq_trace_id_mail_id (trace_id ASC, mail_id ASC),
  INDEX fk_mail_id (mail_id ASC),
  INDEX fk_trace_id (trace_id ASC),
  CONSTRAINT fk_trace_has_mail_trace_id
    FOREIGN KEY (trace_id)
    REFERENCES trace (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_trace_has_mail_mail_id
    FOREIGN KEY (mail_id)
    REFERENCES mail (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

CREATE TABLE trace_type_has_mail (
  trace_type_id INT(10) UNSIGNED NOT NULL,
  mail_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (trace_type_id, mail_id),
  UNIQUE INDEX uq_trace_type_id_mail_id (trace_type_id ASC, mail_id ASC),
  INDEX fk_mail_id (mail_id ASC),
  INDEX fk_trace_type_id (trace_type_id ASC),
  CONSTRAINT fk_trace_type_has_mail_trace_type_id
    FOREIGN KEY (trace_type_id)
    REFERENCES beartooth.trace_type (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_trace_type_has_mail_mail_id
    FOREIGN KEY (mail_id)
    REFERENCES cenozo.mail (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

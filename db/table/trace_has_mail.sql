CREATE TABLE trace_has_mail (
  trace_id int(10) unsigned NOT NULL,
  mail_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (trace_id,mail_id),
  UNIQUE KEY uq_trace_id_mail_id (trace_id,mail_id),
  KEY fk_mail_id (mail_id),
  KEY fk_trace_id (trace_id),
  CONSTRAINT fk_trace_has_mail_mail_id
    FOREIGN KEY (mail_id)
    REFERENCES mail (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_trace_has_mail_trace_id
    FOREIGN KEY (trace_id)
    REFERENCES trace (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

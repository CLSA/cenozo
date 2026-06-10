CREATE TABLE trace_type_mail (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  trace_type_id int(10) unsigned DEFAULT NULL,
  language_id int(10) unsigned NOT NULL,
  from_name varchar(255) DEFAULT NULL,
  from_address varchar(127) NOT NULL,
  cc_address varchar(255) DEFAULT NULL,
  bcc_address varchar(255) DEFAULT NULL,
  delay_offset int(10) unsigned NOT NULL DEFAULT 1,
  delay_unit enum('days','weeks','months') NOT NULL DEFAULT 'weeks',
  subject varchar(255) NOT NULL,
  body mediumtext NOT NULL,
  PRIMARY KEY (id),
  KEY fk_trace_type_id (trace_type_id),
  KEY fk_language_id (language_id),
  CONSTRAINT fk_trace_type_mail_language_id
    FOREIGN KEY (language_id)
    REFERENCES language (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_trace_type_mail_trace_type_id
    FOREIGN KEY (trace_type_id)
    REFERENCES trace_type (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
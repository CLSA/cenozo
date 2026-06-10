CREATE TABLE trace (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  participant_id int(10) unsigned NOT NULL,
  trace_type_id int(10) unsigned DEFAULT NULL,
  datetime datetime NOT NULL,
  user_id int(10) unsigned DEFAULT NULL,
  site_id int(10) unsigned DEFAULT NULL,
  role_id int(10) unsigned DEFAULT NULL,
  application_id int(10) unsigned DEFAULT NULL,
  note mediumtext DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_participant_id_datetime (participant_id,datetime),
  KEY fk_participant_id (participant_id),
  KEY fk_trace_type_id (trace_type_id),
  KEY fk_user_id (user_id),
  KEY fk_site_id (site_id),
  KEY fk_role_id (role_id),
  KEY fk_application_id (application_id),
  CONSTRAINT fk_trace_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_trace_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_trace_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_trace_site_id
    FOREIGN KEY (site_id)
    REFERENCES site (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_trace_trace_type_id
    FOREIGN KEY (trace_type_id)
    REFERENCES trace_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_trace_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
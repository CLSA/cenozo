CREATE TABLE event (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  participant_id int(10) unsigned NOT NULL,
  event_type_id int(10) unsigned NOT NULL,
  site_id int(10) unsigned DEFAULT NULL,
  user_id int(10) unsigned DEFAULT NULL,
  datetime datetime NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_participant_id_event_type_id_datetime (participant_id,event_type_id,datetime),
  KEY fk_participant_id (participant_id),
  KEY dk_datetime (datetime),
  KEY fk_event_type_id (event_type_id),
  KEY fk_user_id (user_id),
  KEY fk_site_id (site_id),
  CONSTRAINT fk_event_event_type_id
    FOREIGN KEY (event_type_id)
    REFERENCES event_type (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_event_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_event_site_id
    FOREIGN KEY (site_id)
    REFERENCES site (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_event_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
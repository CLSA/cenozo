CREATE TABLE participant_last_event (
  participant_id int(10) unsigned NOT NULL,
  event_type_id int(10) unsigned NOT NULL,
  event_id int(10) unsigned DEFAULT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (participant_id,event_type_id),
  KEY fk_event_type_id (event_type_id),
  KEY fk_event_id (event_id),
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
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
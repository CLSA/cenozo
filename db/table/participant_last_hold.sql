CREATE TABLE participant_last_hold (
  participant_id int(10) unsigned NOT NULL,
  hold_id int(10) unsigned DEFAULT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (participant_id),
  KEY fk_hold_id (hold_id),
  CONSTRAINT fk_participant_last_hold_hold_id
    FOREIGN KEY (hold_id)
    REFERENCES hold (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_participant_last_hold_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
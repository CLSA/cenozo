CREATE TABLE participant_last_hin (
  participant_id int(10) unsigned NOT NULL,
  hin_id int(10) unsigned DEFAULT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (participant_id),
  KEY fk_hin_id (hin_id),
  CONSTRAINT fk_participant_last_hin_hin_id
    FOREIGN KEY (hin_id)
    REFERENCES hin (id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION,
  CONSTRAINT fk_participant_last_hin_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
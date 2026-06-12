CREATE TABLE stratum_has_participant (
  stratum_id int(10) unsigned NOT NULL,
  participant_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (stratum_id,participant_id),
  KEY fk_participant_id (participant_id),
  KEY fk_stratum_id (stratum_id),
  CONSTRAINT fk_stratum_has_participant_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_stratum_has_participant_stratum_id
    FOREIGN KEY (stratum_id)
    REFERENCES stratum (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE study_has_participant (
  study_id int(10) unsigned NOT NULL,
  participant_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (study_id,participant_id),
  KEY fk_participant_id (participant_id),
  KEY fk_study_id (study_id),
  CONSTRAINT fk_study_has_participant_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_study_has_participant_study_id
    FOREIGN KEY (study_id)
    REFERENCES study (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
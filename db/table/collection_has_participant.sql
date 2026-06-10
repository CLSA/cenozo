CREATE TABLE collection_has_participant (
  collection_id int(10) unsigned NOT NULL,
  participant_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (collection_id,participant_id),
  KEY fk_participant_id (participant_id),
  KEY fk_collection_id (collection_id),
  CONSTRAINT fk_collection_has_participant_collection_id
    FOREIGN KEY (collection_id)
    REFERENCES collection (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_collection_has_participant_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
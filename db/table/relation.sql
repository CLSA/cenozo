CREATE TABLE relation (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  primary_participant_id int(10) unsigned NOT NULL,
  participant_id int(10) unsigned NOT NULL,
  relation_type_id int(10) unsigned NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_primary_participant_id_relation_type_id (primary_participant_id,relation_type_id),
  UNIQUE KEY uq_participant_id (participant_id),
  KEY fk_primary_participant_id (primary_participant_id),
  KEY fk_participant_id (participant_id),
  KEY fk_relation_type_id (relation_type_id),
  CONSTRAINT fk_relation_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_relation_primary_participant_id
    FOREIGN KEY (primary_participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_relation_relation_type_id
    FOREIGN KEY (relation_type_id)
    REFERENCES relation_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

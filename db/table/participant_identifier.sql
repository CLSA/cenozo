CREATE TABLE participant_identifier (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  identifier_id int(10) unsigned NOT NULL,
  participant_id int(10) unsigned NOT NULL,
  value varchar(45) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_identifier_id_participant_id (identifier_id,participant_id),
  UNIQUE KEY uq_identifier_id_value (identifier_id,value),
  KEY fk_identifier_id (identifier_id),
  KEY fk_participant_id (participant_id),
  CONSTRAINT fk_participant_identifier_identifier_id
    FOREIGN KEY (identifier_id)
    REFERENCES identifier (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_participant_identifier_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

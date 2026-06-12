CREATE TABLE variable_cache (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  participant_id int(10) unsigned NOT NULL,
  variable varchar(255) NOT NULL,
  value varchar(255) DEFAULT NULL,
  expiry datetime DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_participant_id_variable (participant_id,variable),
  KEY fk_participant_id (participant_id),
  KEY dk_variable (variable),
  CONSTRAINT fk_variable_cache_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE study_phase (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  study_id int(10) unsigned NOT NULL,
  rank int(10) unsigned NOT NULL,
  code char(2) NOT NULL,
  name varchar(45) NOT NULL,
  identifier_id int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_study_id_rank (study_id,rank),
  UNIQUE KEY uq_study_id_code (study_id,code),
  UNIQUE KEY uq_study_id_name (study_id,name),
  KEY fk_study_id (study_id),
  KEY fk_identifier_id (identifier_id),
  CONSTRAINT fk_study_phase_identifier_id
    FOREIGN KEY (identifier_id)
    REFERENCES identifier (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_study_phase_study_id
    FOREIGN KEY (study_id)
    REFERENCES study (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
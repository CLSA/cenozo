CREATE TABLE stratum (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  study_id int(10) unsigned NOT NULL,
  name varchar(255) NOT NULL,
  description mediumtext DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_study_id_name (study_id,name),
  KEY fk_study_id (study_id),
  CONSTRAINT fk_stratum_study_id
    FOREIGN KEY (study_id)
    REFERENCES study (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE hin (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  participant_id int(10) unsigned NOT NULL,
  code varchar(45) NOT NULL,
  region_id int(10) unsigned DEFAULT NULL,
  datetime datetime NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_participant_id_datetime (participant_id,datetime),
  KEY fk_participant_id (participant_id),
  KEY fk_region_id (region_id),
  KEY dk_participant_id_datetime (participant_id,datetime),
  CONSTRAINT fk_hin_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_hin_region_id
    FOREIGN KEY (region_id)
    REFERENCES region (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
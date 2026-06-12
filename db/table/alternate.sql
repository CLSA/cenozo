CREATE TABLE alternate (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  participant_id int(10) unsigned NOT NULL,
  language_id int(10) unsigned NOT NULL,
  active tinyint(1) NOT NULL DEFAULT 1,
  first_name varchar(45) NOT NULL,
  last_name varchar(45) NOT NULL,
  association varchar(45) DEFAULT NULL,
  email varchar(255) DEFAULT NULL,
  email_datetime datetime DEFAULT NULL,
  email_old varchar(255) DEFAULT NULL,
  email2 varchar(255) DEFAULT NULL,
  email2_datetime datetime DEFAULT NULL,
  email2_old varchar(255) DEFAULT NULL,
  global_note mediumtext DEFAULT NULL,
  PRIMARY KEY (id),
  KEY fk_participant_id (participant_id),
  KEY fk_language_id (language_id),
  CONSTRAINT fk_alternate_language_id
    FOREIGN KEY (language_id)
    REFERENCES language (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_alternate_participant
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

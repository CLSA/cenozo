CREATE TABLE note (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  alternate_id int(10) unsigned DEFAULT NULL,
  participant_id int(10) unsigned DEFAULT NULL,
  user_id int(10) unsigned NOT NULL,
  sticky tinyint(1) NOT NULL DEFAULT 0,
  datetime datetime NOT NULL,
  note mediumtext NOT NULL,
  PRIMARY KEY (id),
  KEY fk_user_id (user_id),
  KEY dk_sticky_datetime (sticky,datetime),
  KEY fk_alternate_id (alternate_id),
  KEY fk_participant_id (participant_id),
  CONSTRAINT fk_note_alternate_id
    FOREIGN KEY (alternate_id)
    REFERENCES alternate (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_note_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_note_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
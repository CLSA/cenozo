CREATE TABLE note (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  alternate_id INT(10) UNSIGNED NULL DEFAULT NULL,
  participant_id INT(10) UNSIGNED NULL DEFAULT NULL,
  user_id INT(10) UNSIGNED NOT NULL,
  sticky TINYINT(1) NOT NULL DEFAULT 0,
  datetime DATETIME NOT NULL,
  note TEXT NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_user_id (user_id ASC),
  INDEX dk_sticky_datetime (sticky ASC, datetime ASC),
  INDEX fk_alternate_id (alternate_id ASC),
  INDEX fk_participant_id (participant_id ASC),
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
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

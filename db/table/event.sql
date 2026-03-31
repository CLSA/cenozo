CREATE TABLE event (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  participant_id INT(10) UNSIGNED NOT NULL,
  event_type_id INT(10) UNSIGNED NOT NULL,
  site_id INT(10) UNSIGNED NULL DEFAULT NULL,
  user_id INT(10) UNSIGNED NULL DEFAULT NULL,
  datetime DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_participant_id_event_type_id_datetime (participant_id ASC, event_type_id ASC, datetime ASC),
  INDEX fk_participant_id (participant_id ASC),
  INDEX dk_datetime (datetime ASC),
  INDEX fk_event_type_id (event_type_id ASC),
  INDEX fk_user_id (user_id ASC),
  INDEX fk_site_id (site_id ASC),
  CONSTRAINT fk_event_event_type_id
    FOREIGN KEY (event_type_id)
    REFERENCES event_type (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_event_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_event_site_id
    FOREIGN KEY (site_id)
    REFERENCES site (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_event_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

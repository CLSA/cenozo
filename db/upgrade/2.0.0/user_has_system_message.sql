SELECT "Creating new user_has_system_message table" AS "";

CREATE TABLE IF NOT EXISTS user_has_system_message (
  user_id INT UNSIGNED NOT NULL,
  system_message_id INT UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  PRIMARY KEY (user_id, system_message_id),
  INDEX fk_system_message_id (system_message_id ASC),
  INDEX fk_user_id (user_id ASC),
  CONSTRAINT fk_user_has_system_message_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_user_has_system_message_system_message_id
    FOREIGN KEY (system_message_id)
    REFERENCES system_message (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

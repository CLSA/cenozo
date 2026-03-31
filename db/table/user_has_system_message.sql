CREATE TABLE user_has_system_message (
  user_id INT(10) UNSIGNED NOT NULL,
  system_message_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (user_id, system_message_id),
  INDEX fk_system_message_id (system_message_id ASC),
  INDEX fk_user_id (user_id ASC),
  CONSTRAINT fk_user_has_system_message_system_message_id
    FOREIGN KEY (system_message_id)
    REFERENCES system_message (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_user_has_system_message_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

CREATE TABLE user_has_system_message (
  user_id int(10) unsigned NOT NULL,
  system_message_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (user_id,system_message_id),
  KEY fk_system_message_id (system_message_id),
  KEY fk_user_id (user_id),
  CONSTRAINT fk_user_has_system_message_system_message_id
    FOREIGN KEY (system_message_id)
    REFERENCES system_message (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_user_has_system_message_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
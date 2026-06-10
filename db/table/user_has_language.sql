CREATE TABLE user_has_language (
  user_id int(10) unsigned NOT NULL,
  language_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (user_id,language_id),
  KEY fk_language_id (language_id),
  KEY fk_user_id (user_id),
  CONSTRAINT fk_user_has_language_language_id
    FOREIGN KEY (language_id)
    REFERENCES language (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_user_has_language_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
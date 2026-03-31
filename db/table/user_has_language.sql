CREATE TABLE user_has_language (
  user_id INT(10) UNSIGNED NOT NULL,
  language_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (user_id, language_id),
  INDEX fk_language_id (language_id ASC),
  INDEX fk_user_id (user_id ASC),
  CONSTRAINT fk_user_has_language_language_id
    FOREIGN KEY (language_id)
    REFERENCES language (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_user_has_language_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

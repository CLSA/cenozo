CREATE TABLE user_has_collection (
  user_id INT(10) UNSIGNED NOT NULL,
  collection_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (user_id, collection_id),
  INDEX fk_collection_id (collection_id ASC),
  INDEX fk_user_id (user_id ASC),
  CONSTRAINT fk_user_has_collection_collection_id
    FOREIGN KEY (collection_id)
    REFERENCES collection (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_user_has_collection_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8_bin
COMMENT = 'Users who can edit locked collections.';

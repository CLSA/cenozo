SELECT "Creating new user_has_collection table" AS "";

CREATE TABLE IF NOT EXISTS user_has_collection (
  user_id INT UNSIGNED NOT NULL,
  collection_id INT UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  PRIMARY KEY (user_id, collection_id),
  INDEX fk_collection_id (collection_id ASC),
  INDEX fk_user_id (user_id ASC),
  CONSTRAINT fk_user_has_collection_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_user_has_collection_collection_id
    FOREIGN KEY (collection_id)
    REFERENCES collection (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB
COMMENT = 'Users who can edit locked collections.';

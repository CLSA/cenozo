CREATE TABLE application_has_collection (
  application_id INT(10) UNSIGNED NOT NULL,
  collection_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (application_id, collection_id),
  INDEX fk_collection_id (collection_id ASC),
  INDEX fk_application_id (application_id ASC),
  CONSTRAINT fk_application_has_collection_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_application_has_collection_collection_id
    FOREIGN KEY (collection_id)
    REFERENCES collection (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS application_has_collection (
  application_id INT UNSIGNED NOT NULL,
  collection_id INT UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
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
ENGINE = InnoDB;

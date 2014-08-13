SELECT "Creating new collection_has_participant table" AS "";

CREATE TABLE IF NOT EXISTS collection_has_participant (
  collection_id INT UNSIGNED NOT NULL,
  participant_id INT UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  PRIMARY KEY (collection_id, participant_id),
  INDEX fk_participant_id (participant_id ASC),
  INDEX fk_collection_id (collection_id ASC),
  CONSTRAINT fk_collection_has_participant_collection_id
    FOREIGN KEY (collection_id)
    REFERENCES collection (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_collection_has_participant_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

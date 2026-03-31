CREATE TABLE collection_has_participant (
  collection_id INT(10) UNSIGNED NOT NULL,
  participant_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
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
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

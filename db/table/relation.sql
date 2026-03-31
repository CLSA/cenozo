CREATE TABLE relation (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  primary_participant_id INT(10) UNSIGNED NOT NULL,
  participant_id INT(10) UNSIGNED NOT NULL,
  relation_type_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_primary_participant_id (primary_participant_id ASC),
  INDEX fk_participant_id (participant_id ASC),
  INDEX fk_relation_type_id (relation_type_id ASC),
  UNIQUE INDEX uq_primary_participant_id_relation_type_id (primary_participant_id ASC, relation_type_id ASC),
  UNIQUE INDEX uq_participant_id (participant_id ASC),
  CONSTRAINT fk_relation_primary_participant_id
    FOREIGN KEY (primary_participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_relation_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_relation_relation_type_id
    FOREIGN KEY (relation_type_id)
    REFERENCES relation_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

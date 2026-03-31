CREATE TABLE study_has_participant (
  study_id INT(10) UNSIGNED NOT NULL,
  participant_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (study_id, participant_id),
  INDEX fk_participant_id (participant_id ASC),
  INDEX fk_study_id (study_id ASC),
  CONSTRAINT fk_study_has_participant_study_id
    FOREIGN KEY (study_id)
    REFERENCES study (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_study_has_participant_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

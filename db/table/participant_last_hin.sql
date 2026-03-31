CREATE TABLE participant_last_hin (
  participant_id INT(10) UNSIGNED NOT NULL,
  hin_id INT(10) UNSIGNED NULL DEFAULT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (participant_id),
  INDEX fk_hin_id (hin_id ASC),
  CONSTRAINT fk_participant_last_hin_hin_id
    FOREIGN KEY (hin_id)
    REFERENCES hin (id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION,
  CONSTRAINT fk_participant_last_hin_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

CREATE TABLE hin (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  participant_id INT(10) UNSIGNED NOT NULL,
  code VARCHAR(45) NOT NULL,
  region_id INT(10) UNSIGNED NULL DEFAULT NULL,
  datetime DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_participant_id_datetime (participant_id ASC, datetime ASC),
  INDEX fk_participant_id (participant_id ASC),
  INDEX fk_region_id (region_id ASC),
  CONSTRAINT fk_hin_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_hin_region_id
    FOREIGN KEY (region_id)
    REFERENCES region (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

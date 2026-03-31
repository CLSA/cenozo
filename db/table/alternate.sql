CREATE TABLE alternate (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  participant_id INT(10) UNSIGNED NOT NULL,
  language_id INT(10) UNSIGNED NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  first_name VARCHAR(45) NOT NULL,
  last_name VARCHAR(45) NOT NULL,
  association VARCHAR(45) NULL DEFAULT NULL,
  email VARCHAR(255) NULL DEFAULT NULL,
  email_datetime DATETIME NULL DEFAULT NULL,
  email_old VARCHAR(255) NULL DEFAULT NULL,
  email2 VARCHAR(255) NULL DEFAULT NULL,
  email2_datetime DATETIME NULL DEFAULT NULL,
  email2_old VARCHAR(255) NULL DEFAULT NULL,
  global_note TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  INDEX fk_participant_id (participant_id ASC),
  INDEX fk_language_id (language_id ASC),
  CONSTRAINT fk_alternate_participant
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_alternate_language_id
    FOREIGN KEY (language_id)
    REFERENCES language (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

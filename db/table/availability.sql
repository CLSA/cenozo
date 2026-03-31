CREATE TABLE availability (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  participant_id INT(10) UNSIGNED NOT NULL,
  monday TINYINT(1) NOT NULL DEFAULT 0,
  tuesday TINYINT(1) NOT NULL DEFAULT 0,
  wednesday TINYINT(1) NOT NULL DEFAULT 0,
  thursday TINYINT(1) NOT NULL DEFAULT 0,
  friday TINYINT(1) NOT NULL DEFAULT 0,
  saturday TINYINT(1) NOT NULL DEFAULT 0,
  sunday TINYINT(1) NOT NULL DEFAULT 0,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_participant_id (participant_id ASC),
  INDEX dk_start_time (start_time ASC),
  INDEX dk_end_time (end_time ASC),
  CONSTRAINT fk_availability_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

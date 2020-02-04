SELECT "Creating new mail table" AS "";

CREATE TABLE IF NOT EXISTS mail (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  participant_id INT UNSIGNED NOT NULL,
  from_name VARCHAR(255) NULL DEFAULT NULL,
  from_address VARCHAR(127) NOT NULL,
  to_name VARCHAR(255) NULL DEFAULT NULL,
  to_address VARCHAR(127) NOT NULL,
  cc_address VARCHAR(255) NULL DEFAULT NULL,
  bcc_address VARCHAR(255) NULL DEFAULT NULL,
  schedule_datetime DATETIME NOT NULL,
  sent_datetime DATETIME NULL DEFAULT NULL,
  sent TINYINT(1) NULL DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  note TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  INDEX fk_participant_id (participant_id ASC),
  UNIQUE INDEX uq_participant_id_scheduled_datetime (participant_id ASC, schedule_datetime ASC),
  CONSTRAINT fk_mail_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

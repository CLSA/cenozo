SELECT "Creating new event_mail table" AS "";

CREATE TABLE IF NOT EXISTS event_mail (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  event_id INT(10) UNSIGNED NOT NULL,
  to_address VARCHAR(127) NOT NULL,
  cc_address VARCHAR(255) NOT NULL,
  datetime DATETIME NOT NULL,
  sent TINYINT(1) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_event_id (event_id ASC),
  CONSTRAINT fk_event_mail_event_id
    FOREIGN KEY (event_id)
    REFERENCES event (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

SELECT "Creating new event_type_mail table" AS "";

CREATE TABLE IF NOT EXISTS event_type_mail (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  event_type_id INT(10) UNSIGNED NOT NULL,
  to_address VARCHAR(127) NOT NULL,
  cc_address VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_event_type_id (event_type_id ASC),
  CONSTRAINT fk_event_type_mail_event_type_id
    FOREIGN KEY (event_type_id)
    REFERENCES event_type (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

SELECT "Creating new failed_login table" AS "";

CREATE TABLE IF NOT EXISTS failed_login (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  application_id INT UNSIGNED NOT NULL,
  address VARCHAR(45) NOT NULL,
  datetime DATETIME NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_user_id (user_id ASC),
  INDEX fk_application_id (application_id ASC),
  CONSTRAINT fk_failed_login_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_failed_login_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

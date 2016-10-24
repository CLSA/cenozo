SELECT "Adding new export caching table" AS "";

CREATE TABLE IF NOT EXISTS export (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  application_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  description TEXT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_title (title ASC),
  INDEX fk_user_id (user_id ASC),
  INDEX fk_export_application_id (application_id ASC),
  CONSTRAINT fk_export_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_export_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

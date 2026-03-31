CREATE TABLE export (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  application_id INT(10) UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  user_id INT(10) UNSIGNED NOT NULL,
  description TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_application_id_title (application_id ASC, title ASC),
  INDEX fk_user_id (user_id ASC),
  INDEX fk_export_application_id (application_id ASC),
  CONSTRAINT fk_export_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_export_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

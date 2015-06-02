SELECT "Redefining activity table" AS "";

CREATE TABLE IF NOT EXISTS activity (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  site_id INT UNSIGNED NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NULL,
  PRIMARY KEY (id),
  INDEX fk_activity_user_id (user_id ASC),
  INDEX fk_activity_site_id (site_id ASC),
  INDEX fk_activity_role_id (role_id ASC),
  CONSTRAINT fk_activity_user1
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_activity_site1
    FOREIGN KEY (site_id)
    REFERENCES site (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_activity_role1
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

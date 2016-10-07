SELECT "Creating new role_has_overview table" AS "";

CREATE TABLE IF NOT EXISTS role_has_overview (
  role_id INT UNSIGNED NOT NULL,
  overview_id INT UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  PRIMARY KEY (role_id, overview_id),
  INDEX fk_overview_id (overview_id ASC),
  INDEX fk_role_id (role_id ASC),
  CONSTRAINT fk_role_has_overview_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_role_has_overview_overview_id
    FOREIGN KEY (overview_id)
    REFERENCES overview (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

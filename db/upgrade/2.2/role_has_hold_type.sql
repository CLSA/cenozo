SELECT "Creating new role_has_hold_type table" AS "";

CREATE TABLE IF NOT EXISTS role_has_hold_type (
  role_id INT UNSIGNED NOT NULL,
  hold_type_id INT UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  PRIMARY KEY (role_id, hold_type_id),
  INDEX fk_hold_type_id (hold_type_id ASC),
  INDEX fk_role_id (role_id ASC),
  CONSTRAINT fk_role_has_hold_type_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_role_has_hold_type_hold_type_id
    FOREIGN KEY (hold_type_id)
    REFERENCES hold_type (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

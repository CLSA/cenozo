SELECT "Creating new alternate_has_alternate_type table" AS "";

CREATE TABLE IF NOT EXISTS alternate_has_alternate_type (
  alternate_id INT(10) UNSIGNED NOT NULL,
  alternate_type_id INT UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  PRIMARY KEY (alternate_id, alternate_type_id),
  INDEX fk_alternate_type_id (alternate_type_id ASC),
  INDEX fk_alternate_id (alternate_id ASC),
  CONSTRAINT fk_alternate_has_alternate_type_alternate_id
    FOREIGN KEY (alternate_id)
    REFERENCES alternate (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_alternate_has_alternate_type_alternate_type_id
    FOREIGN KEY (alternate_type_id)
    REFERENCES alternate_type (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

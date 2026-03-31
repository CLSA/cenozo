CREATE TABLE alternate_has_alternate_type (
  alternate_id INT(10) UNSIGNED NOT NULL,
  alternate_type_id INT UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
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
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

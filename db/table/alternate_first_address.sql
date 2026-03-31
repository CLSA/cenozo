CREATE TABLE alternate_first_address (
  alternate_id INT(10) UNSIGNED NOT NULL,
  address_id INT(10) UNSIGNED NULL DEFAULT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (alternate_id),
  INDEX fk_address_id (address_id ASC),
  CONSTRAINT fk_alternate_first_address_address_id
    FOREIGN KEY (address_id)
    REFERENCES address (id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION,
  CONSTRAINT fk_alternate_first_address_alternate_id
    FOREIGN KEY (alternate_id)
    REFERENCES alternate (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

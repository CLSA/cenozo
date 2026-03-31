CREATE TABLE region (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  name VARCHAR(45) NOT NULL,
  abbreviation VARCHAR(5) NOT NULL,
  country_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC),
  UNIQUE INDEX uq_abbreviation (abbreviation ASC),
  INDEX fk_country_id (country_id ASC),
  CONSTRAINT fk_region_country_id
    FOREIGN KEY (country_id)
    REFERENCES country (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

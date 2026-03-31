CREATE TABLE postcode (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  name VARCHAR(7) NOT NULL COMMENT 'Postcodes with the same province, tz and dst are grouped.',
  region_id INT(10) UNSIGNED NOT NULL,
  timezone_offset FLOAT NOT NULL,
  daylight_savings TINYINT(1) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC),
  INDEX fk_region_id (region_id ASC),
  CONSTRAINT fk_postcode_region_id
    FOREIGN KEY (region_id)
    REFERENCES region (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

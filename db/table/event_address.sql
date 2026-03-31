CREATE TABLE event_address (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  event_id INT(10) UNSIGNED NOT NULL,
  address_id INT(10) UNSIGNED NULL DEFAULT NULL,
  international TINYINT(1) NOT NULL DEFAULT 0,
  address1 VARCHAR(512) NOT NULL,
  address2 VARCHAR(512) NULL DEFAULT NULL,
  city VARCHAR(100) NOT NULL,
  region_id INT(10) UNSIGNED NULL DEFAULT NULL,
  postcode VARCHAR(10) NULL DEFAULT NULL,
  PRIMARY KEY (id),
  INDEX fk_event_id (event_id ASC),
  INDEX fk_address_id (address_id ASC),
  INDEX fk_region_id (region_id ASC),
  CONSTRAINT fk_event_address_address_id
    FOREIGN KEY (address_id)
    REFERENCES address (id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION,
  CONSTRAINT fk_event_address_event_id
    FOREIGN KEY (event_id)
    REFERENCES event (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_event_address_region_id
    FOREIGN KEY (region_id)
    REFERENCES region (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

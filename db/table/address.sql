CREATE TABLE address (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  alternate_id INT(10) UNSIGNED NULL DEFAULT NULL,
  participant_id INT(10) UNSIGNED NULL DEFAULT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  rank INT(11) NOT NULL,
  international TINYINT(1) NOT NULL DEFAULT 0,
  address1 VARCHAR(512) NOT NULL,
  address2 VARCHAR(512) NULL DEFAULT NULL,
  city VARCHAR(100) NOT NULL,
  region_id INT(10) UNSIGNED NULL DEFAULT NULL,
  postcode VARCHAR(10) NULL DEFAULT NULL,
  international_region VARCHAR(100) NULL DEFAULT NULL,
  international_country_id INT UNSIGNED NULL DEFAULT NULL,
  timezone_offset FLOAT NOT NULL DEFAULT 0,
  daylight_savings TINYINT(1) NOT NULL DEFAULT 0,
  january TINYINT(1) NOT NULL DEFAULT 1,
  february TINYINT(1) NOT NULL DEFAULT 1,
  march TINYINT(1) NOT NULL DEFAULT 1,
  april TINYINT(1) NOT NULL DEFAULT 1,
  may TINYINT(1) NOT NULL DEFAULT 1,
  june TINYINT(1) NOT NULL DEFAULT 1,
  july TINYINT(1) NOT NULL DEFAULT 1,
  august TINYINT(1) NOT NULL DEFAULT 1,
  september TINYINT(1) NOT NULL DEFAULT 1,
  october TINYINT(1) NOT NULL DEFAULT 1,
  november TINYINT(1) NOT NULL DEFAULT 1,
  december TINYINT(1) NOT NULL DEFAULT 1,
  note TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_alternate_id_participant_id_rank (alternate_id ASC, participant_id ASC, rank ASC),
  INDEX fk_region_id (region_id ASC),
  INDEX dk_city (city ASC),
  INDEX dk_postcode (postcode ASC),
  INDEX fk_alternate_id (alternate_id ASC),
  INDEX fk_participant_id (participant_id ASC),
  INDEX fk_address_international_country_id (international_country_id ASC),
  CONSTRAINT fk_address_alternate_id
    FOREIGN KEY (alternate_id)
    REFERENCES alternate (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_address_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_address_region
    FOREIGN KEY (region_id)
    REFERENCES region (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_address_international_country_id
    FOREIGN KEY (international_country_id)
    REFERENCES country (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

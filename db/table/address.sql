CREATE TABLE address (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  alternate_id int(10) unsigned DEFAULT NULL,
  participant_id int(10) unsigned DEFAULT NULL,
  active tinyint(1) NOT NULL DEFAULT 1,
  rank int(11) NOT NULL,
  international tinyint(1) NOT NULL DEFAULT 0,
  address1 varchar(512) NOT NULL,
  address2 varchar(512) DEFAULT NULL,
  city varchar(100) NOT NULL,
  region_id int(10) unsigned DEFAULT NULL,
  postcode varchar(10) DEFAULT NULL,
  international_region varchar(100) DEFAULT NULL,
  international_country_id int(10) unsigned DEFAULT NULL,
  timezone_offset float NOT NULL DEFAULT 0,
  daylight_savings tinyint(1) NOT NULL DEFAULT 0,
  january tinyint(1) NOT NULL DEFAULT 1,
  february tinyint(1) NOT NULL DEFAULT 1,
  march tinyint(1) NOT NULL DEFAULT 1,
  april tinyint(1) NOT NULL DEFAULT 1,
  may tinyint(1) NOT NULL DEFAULT 1,
  june tinyint(1) NOT NULL DEFAULT 1,
  july tinyint(1) NOT NULL DEFAULT 1,
  august tinyint(1) NOT NULL DEFAULT 1,
  september tinyint(1) NOT NULL DEFAULT 1,
  october tinyint(1) NOT NULL DEFAULT 1,
  november tinyint(1) NOT NULL DEFAULT 1,
  december tinyint(1) NOT NULL DEFAULT 1,
  note mediumtext DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_alternate_id_participant_id_rank (alternate_id,participant_id,rank),
  KEY fk_region_id (region_id),
  KEY dk_city (city),
  KEY dk_postcode (postcode),
  KEY fk_alternate_id (alternate_id),
  KEY fk_participant_id (participant_id),
  KEY fk_international_country_id (international_country_id),
  CONSTRAINT fk_address_alternate_id
    FOREIGN KEY (alternate_id)
    REFERENCES alternate (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_address_international_country_id
    FOREIGN KEY (international_country_id)
    REFERENCES country (id)
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
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE postcode (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  name varchar(7) NOT NULL COMMENT 'Postcodes with the same province, tz and dst are grouped.',
  region_id int(10) unsigned NOT NULL,
  timezone_offset float NOT NULL,
  daylight_savings tinyint(1) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_name (name),
  KEY fk_region_id (region_id),
  CONSTRAINT fk_postcode_region_id
    FOREIGN KEY (region_id)
    REFERENCES region (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
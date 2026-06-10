CREATE TABLE site (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  name varchar(45) NOT NULL,
  timezone varchar(45) NOT NULL DEFAULT 'Canada/Eastern',
  title varchar(45) DEFAULT NULL,
  phone_number varchar(45) DEFAULT NULL,
  address1 varchar(512) DEFAULT NULL,
  address2 varchar(512) DEFAULT NULL,
  city varchar(100) DEFAULT NULL,
  region_id int(10) unsigned DEFAULT NULL,
  postcode varchar(10) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_name (name),
  KEY fk_site_region_id (region_id),
  CONSTRAINT fk_site_region_id
    FOREIGN KEY (region_id)
    REFERENCES region (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE event_address (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  event_id int(10) unsigned NOT NULL,
  address_id int(10) unsigned DEFAULT NULL,
  international tinyint(1) NOT NULL DEFAULT 0,
  address1 varchar(512) NOT NULL,
  address2 varchar(512) DEFAULT NULL,
  city varchar(100) NOT NULL,
  region_id int(10) unsigned DEFAULT NULL,
  postcode varchar(10) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY fk_event_id (event_id),
  KEY fk_address_id (address_id),
  KEY fk_region_id (region_id),
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
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

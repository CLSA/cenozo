CREATE TABLE equipment (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  equipment_type_id int(10) unsigned NOT NULL,
  site_id int(10) unsigned DEFAULT NULL,
  active tinyint(1) NOT NULL DEFAULT 0,
  serial_number varchar(45) NOT NULL,
  status enum('new','loaned','returned','lost') NOT NULL DEFAULT 'new',
  note text DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_serial_number (serial_number),
  KEY fk_equipment_type_id (equipment_type_id),
  KEY fk_site_id (site_id),
  CONSTRAINT fk_equipment_equipment_type_id
    FOREIGN KEY (equipment_type_id)
    REFERENCES equipment_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_equipment_site_id
    FOREIGN KEY (site_id)
    REFERENCES site (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
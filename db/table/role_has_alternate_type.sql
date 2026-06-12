CREATE TABLE role_has_alternate_type (
  role_id int(10) unsigned NOT NULL,
  alternate_type_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (role_id,alternate_type_id),
  KEY fk_alternate_type_id (alternate_type_id),
  KEY fk_role_id (role_id),
  CONSTRAINT fk_role_has_alternate_type_alternate_type_id
    FOREIGN KEY (alternate_type_id)
    REFERENCES alternate_type (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_role_has_alternate_type_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

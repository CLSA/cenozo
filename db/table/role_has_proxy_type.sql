CREATE TABLE role_has_proxy_type (
  role_id int(10) unsigned NOT NULL,
  proxy_type_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (role_id,proxy_type_id),
  KEY fk_proxy_type_id (proxy_type_id),
  KEY fk_role_id (role_id),
  CONSTRAINT fk_role_has_proxy_type_proxy_type_id
    FOREIGN KEY (proxy_type_id)
    REFERENCES proxy_type (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_role_has_proxy_type_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

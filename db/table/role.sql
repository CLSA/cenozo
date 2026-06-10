CREATE TABLE role (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  name varchar(45) NOT NULL,
  tier int(10) unsigned NOT NULL DEFAULT 1 COMMENT '1 = normal, 2 = site admin, 3 = global admin',
  all_sites tinyint(1) NOT NULL DEFAULT 0,
  special tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
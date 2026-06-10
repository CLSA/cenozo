CREATE TABLE hold_type (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  type enum('final','temporary') NOT NULL,
  name varchar(100) NOT NULL,
  system tinyint(1) NOT NULL DEFAULT 0,
  description varchar(512) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_type_name (type,name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
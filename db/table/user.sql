CREATE TABLE user (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  name varchar(45) NOT NULL,
  password varchar(255) DEFAULT NULL,
  password_type enum('whirlpool','bcrypt') DEFAULT NULL,
  first_name varchar(255) NOT NULL,
  last_name varchar(255) NOT NULL,
  active tinyint(1) NOT NULL DEFAULT 1,
  email varchar(255) DEFAULT NULL,
  timezone varchar(45) NOT NULL DEFAULT 'Canada/Eastern',
  use_12hour_clock tinyint(1) NOT NULL DEFAULT 0,
  login_failures int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_name (name),
  UNIQUE KEY uq_email (email),
  KEY dk_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
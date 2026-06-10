CREATE TABLE report_restriction (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  report_type_id int(10) unsigned NOT NULL,
  rank int(11) NOT NULL,
  name varchar(45) NOT NULL,
  title varchar(45) NOT NULL,
  mandatory tinyint(1) NOT NULL DEFAULT 0,
  null_allowed tinyint(1) NOT NULL DEFAULT 0,
  restriction_type enum('table','identifier_list','string','integer','decimal','date','datetime','time','boolean','enum') NOT NULL,
  custom tinyint(1) NOT NULL DEFAULT 0,
  subject varchar(45) DEFAULT NULL,
  operator enum('=','<=>','!=','<>','<','<=','>','>=') DEFAULT NULL,
  enum_list varchar(511) DEFAULT NULL,
  description mediumtext DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_report_type_id_name (report_type_id,name),
  UNIQUE KEY uq_report_type_id_rank (report_type_id,rank),
  KEY fk_report_type_id (report_type_id),
  CONSTRAINT fk_report_restriction_report_type_id
    FOREIGN KEY (report_type_id)
    REFERENCES report_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
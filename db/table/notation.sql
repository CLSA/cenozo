CREATE TABLE notation (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  application_type_id int(10) unsigned DEFAULT NULL,
  subject varchar(45) NOT NULL,
  type varchar(45) NOT NULL,
  description text NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_application_type_id_subject_type (application_type_id,subject,type),
  KEY fk_application_type_id (application_type_id),
  CONSTRAINT fk_notation_application_type_id
    FOREIGN KEY (application_type_id)
    REFERENCES application_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

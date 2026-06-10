CREATE TABLE form_association (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  form_id int(10) unsigned NOT NULL,
  subject varchar(45) NOT NULL,
  record_id int(10) unsigned NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_form_id_subject_record_id (form_id,subject,record_id),
  KEY fk_form_id (form_id),
  KEY dk_record_id (record_id),
  CONSTRAINT fk_form_association_form_id
    FOREIGN KEY (form_id)
    REFERENCES form (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
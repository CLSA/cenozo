CREATE TABLE event_type_mail (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  event_type_id int(10) unsigned NOT NULL,
  to_address varchar(127) NOT NULL,
  cc_address varchar(255) NOT NULL,
  subject varchar(255) NOT NULL,
  body text NOT NULL,
  PRIMARY KEY (id),
  KEY fk_event_type_id (event_type_id),
  CONSTRAINT fk_event_type_mail_event_type_id
    FOREIGN KEY (event_type_id)
    REFERENCES event_type (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
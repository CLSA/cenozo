CREATE TABLE mail (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  participant_id int(10) unsigned NOT NULL,
  from_name varchar(255) DEFAULT NULL,
  from_address varchar(127) NOT NULL,
  to_name varchar(255) DEFAULT NULL,
  to_address varchar(127) NOT NULL,
  cc_address varchar(255) DEFAULT NULL,
  bcc_address varchar(255) DEFAULT NULL,
  schedule_datetime datetime NOT NULL,
  sent_datetime datetime DEFAULT NULL,
  sent tinyint(1) DEFAULT NULL,
  subject varchar(255) NOT NULL,
  body mediumtext NOT NULL,
  note mediumtext DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_participant_id_scheduled_datetime (participant_id,schedule_datetime),
  KEY fk_participant_id (participant_id),
  CONSTRAINT fk_mail_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

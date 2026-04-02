SELECT "Creating new trace_type_mail table" AS "";

CREATE TABLE IF NOT EXISTS trace_type_mail (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  trace_type_id INT(10) UNSIGNED NULL DEFAULT NULL,
  language_id INT(10) UNSIGNED NOT NULL,
  from_name VARCHAR(255) NULL DEFAULT NULL,
  from_address VARCHAR(127) NOT NULL,
  cc_address VARCHAR(255) NULL DEFAULT NULL,
  bcc_address VARCHAR(255) NULL DEFAULT NULL,
  delay_offset INT(10) UNSIGNED NOT NULL DEFAULT 1,
  delay_unit ENUM('days', 'weeks', 'months') NOT NULL DEFAULT 'weeks',
  subject VARCHAR(255) NOT NULL,
  body MEDIUMTEXT NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_trace_type_id (trace_type_id ASC),
  INDEX fk_language_id (language_id ASC),
  CONSTRAINT fk_trace_type_mail_trace_type_id
    FOREIGN KEY (trace_type_id)
    REFERENCES trace_type (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_trace_type_mail_language_id
    FOREIGN KEY (language_id)
    REFERENCES language (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

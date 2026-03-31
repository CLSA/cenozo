CREATE TABLE report_restriction (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  report_type_id INT(10) UNSIGNED NOT NULL,
  rank INT(11) NOT NULL,
  name VARCHAR(45) NOT NULL,
  title VARCHAR(45) NOT NULL,
  mandatory TINYINT(1) NOT NULL DEFAULT 0,
  null_allowed TINYINT(1) NOT NULL DEFAULT 0,
  restriction_type ENUM('table', 'identifier_list', 'string', 'integer', 'decimal', 'date', 'datetime', 'time', 'boolean', 'enum') NOT NULL,
  custom TINYINT(1) NOT NULL DEFAULT 0,
  subject VARCHAR(45) NULL DEFAULT NULL,
  operator ENUM('=', '<=>', '!=', '<>', '<', '<=', '>', '>=') NULL DEFAULT NULL,
  enum_list VARCHAR(511) NULL DEFAULT NULL,
  description TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_report_type_id_name (report_type_id ASC, name ASC),
  UNIQUE INDEX uq_report_type_id_rank (report_type_id ASC, rank ASC),
  INDEX fk_report_type_id (report_type_id ASC),
  CONSTRAINT fk_report_restriction_report_type_id
    FOREIGN KEY (report_type_id)
    REFERENCES report_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

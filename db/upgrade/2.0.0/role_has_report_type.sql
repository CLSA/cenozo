CREATE TABLE IF NOT EXISTS role_has_report_type (
  role_id INT UNSIGNED NOT NULL,
  report_type_id INT UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  PRIMARY KEY (role_id, report_type_id),
  INDEX fk_report_type_id (report_type_id ASC),
  INDEX fk_role_id (role_id ASC),
  CONSTRAINT fk_role_has_report_type_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_role_has_report_type_report_type_id
    FOREIGN KEY (report_type_id)
    REFERENCES report_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

INSERT IGNORE INTO role_has_report_type( role_id, report_type_id )
SELECT role.id, report_type.id
FROM role, report_type
WHERE role.name = "administrator"
AND report_type.name IN( "Contact", "Email" );

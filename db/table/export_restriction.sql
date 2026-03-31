CREATE TABLE export_restriction (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  export_id INT(10) UNSIGNED NOT NULL,
  table_name VARCHAR(45) NOT NULL,
  subtype VARCHAR(45) NULL DEFAULT NULL,
  column_name VARCHAR(45) NOT NULL,
  rank INT(10) UNSIGNED NOT NULL,
  logic ENUM('or', 'and') NOT NULL,
  test ENUM('<=>', '<>', '<', '>', 'like', 'not like') NOT NULL,
  value VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_export_id_rank (export_id ASC, rank ASC),
  INDEX dk_table_name_subtype (table_name ASC, subtype ASC),
  INDEX fk_export_id (export_id ASC),
  CONSTRAINT fk_export_restriction_export_id
    FOREIGN KEY (export_id)
    REFERENCES export (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

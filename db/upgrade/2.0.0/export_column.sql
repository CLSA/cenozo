SELECT "Adding new export_column caching table" AS "";

CREATE TABLE IF NOT EXISTS export_column (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  export_id INT UNSIGNED NOT NULL,
  table_name VARCHAR(45) NOT NULL,
  subtype VARCHAR(45) NULL DEFAULT NULL,
  column_name VARCHAR(45) NOT NULL,
  rank INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_export_id_rank (export_id ASC, rank ASC),
  INDEX dk_table_name_subtype (table_name ASC, subtype ASC),
  INDEX fk_export_id (export_id ASC),
  CONSTRAINT fk_export_column_export_id
    FOREIGN KEY (export_id)
    REFERENCES export (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

CREATE TABLE export_column (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  export_id int(10) unsigned NOT NULL,
  table_name varchar(45) NOT NULL,
  subtype varchar(45) DEFAULT NULL,
  column_name varchar(45) NOT NULL,
  rank int(10) unsigned NOT NULL,
  include tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_export_id_rank (export_id,rank),
  KEY dk_table_name_subtype (table_name,subtype),
  KEY fk_export_id (export_id),
  CONSTRAINT fk_export_column_export_id
    FOREIGN KEY (export_id)
    REFERENCES export (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
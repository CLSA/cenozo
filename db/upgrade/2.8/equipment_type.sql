SELECT "Create new equipment_type table" AS "";

CREATE TABLE IF NOT EXISTS equipment_type (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC))
ENGINE = InnoDB;

INSERT IGNORE INTO equipment_type( name, description ) VALUES
( "Actigraph", "Actigraphy is a non-invasive method of monitoring human rest/activity cycles. A small actigraph unit, also called an actimetry sensor, is worn for a week or more to measure gross motor activity. The unit is usually in a wristwatch-like package worn on the wrist." ),
( "Muse", "Muse is a brain-sensing headband that uses real-time biofeedback to help you refocus during the day and recover overnight." ),
( "Ticwatch", "" );

SELECT "Creating new application_type_has_role table" AS "";

CREATE TABLE IF NOT EXISTS application_type_has_role (
  application_type_id INT UNSIGNED NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  PRIMARY KEY (application_type_id, role_id),
  INDEX fk_role_id (role_id ASC),
  INDEX fk_application_type_id (application_type_id ASC),
  CONSTRAINT fk_application_type_has_role_application_type_id
    FOREIGN KEY (application_type_id)
    REFERENCES application_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_application_type_has_role_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

INSERT IGNORE INTO application_type_has_role( application_type_id, role_id )
SELECT application_type.id, role.id
FROM application_type, role
WHERE application_type.name = "beartooth"
AND role.name IN ( "administrator", "coordinator", "curator", "helpline", "interviewer", "interviewer+", "onyx" );

INSERT IGNORE INTO application_type_has_role( application_type_id, role_id )
SELECT application_type.id, role.id
FROM application_type, role
WHERE application_type.name = "sabretooth"
AND role.name IN ( "administrator", "supervisor", "curator", "helpline", "operator", "operator+" );

INSERT IGNORE INTO application_type_has_role( application_type_id, role_id )
SELECT application_type.id, role.id
FROM application_type, role
WHERE application_type.name = "mastodon"
AND role.name IN ( "administrator", "curator", "helpline", "opal", "typist" );

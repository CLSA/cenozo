SELECT "Create new role_has_consent_type table" AS "";

CREATE TABLE IF NOT EXISTS role_has_consent_type (
  role_id INT UNSIGNED NOT NULL,
  consent_type_id INT UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  PRIMARY KEY (role_id, consent_type_id),
  INDEX fk_consent_type_id (consent_type_id ASC),
  INDEX fk_role_id (role_id ASC),
  CONSTRAINT fk_role_has_consent_type_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_role_has_consent_type_consent_type_id
    FOREIGN KEY (consent_type_id)
    REFERENCES consent_type (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- grant the administrator role access to all consent types
INSERT IGNORE INTO role_has_consent_type( role_id, consent_type_id )
SELECT role.id, consent_type.id
FROM role, consent_type
WHERE role.name IN( "administrator", "curator" );

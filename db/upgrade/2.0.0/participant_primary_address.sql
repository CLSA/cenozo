DROP PROCEDURE IF EXISTS patch_participant_primary_address;
DELIMITER //
CREATE PROCEDURE patch_participant_primary_address()
  BEGIN

    SELECT "Replaceing participant_primary_address view with caching table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.VIEWS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant_primary_address" );
    IF @test = 1 THEN

      DROP VIEW IF EXISTS participant_primary_address;

      CREATE TABLE IF NOT EXISTS participant_primary_address (
        participant_id INT UNSIGNED NOT NULL,
        address_id INT UNSIGNED NULL,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        PRIMARY KEY (participant_id),
        INDEX fk_participant_id (participant_id ASC),
        INDEX fk_address_id (address_id ASC),
        CONSTRAINT fk_participant_primary_address_participant_id
          FOREIGN KEY (participant_id)
          REFERENCES participant (id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_participant_primary_address_address_id
          FOREIGN KEY (address_id)
          REFERENCES address (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION)
      ENGINE = InnoDB;

      SELECT "Populating participant_primary_address table" AS "";

      REPLACE INTO participant_primary_address( participant_id, address_id )
      SELECT participant.id, address1.id
      FROM participant
      JOIN address AS address1 ON participant.id = address1.participant_id
      WHERE address1.rank = (
        SELECT MIN( address2.rank )
        FROM address AS address2
        JOIN region ON address2.region_id = region.id
        -- Joining to region_site is used to exclude addresses which are not
        -- in region_site, actual linkage (and language) is irrelevant
        JOIN region_site ON region.id = region_site.region_id
        WHERE address2.active
        AND address1.participant_id = address2.participant_id
        GROUP BY address2.participant_id
      );

    END IF;

  END //
DELIMITER ;

CALL patch_participant_primary_address();
DROP PROCEDURE IF EXISTS patch_participant_primary_address;

SELECT "Adding new triggers to participant_primary_address table" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS participant_primary_address_AFTER_INSERT $$
CREATE TRIGGER participant_primary_address_AFTER_INSERT AFTER INSERT ON participant_primary_address FOR EACH ROW
BEGIN
  CALL update_participant_site_for_participant( NEW.participant_id );
END;$$


DROP TRIGGER IF EXISTS participant_primary_address_AFTER_UPDATE $$
CREATE TRIGGER participant_primary_address_AFTER_UPDATE AFTER UPDATE ON participant_primary_address FOR EACH ROW
BEGIN
  CALL update_participant_site_for_participant( NEW.participant_id );
END;$$


DROP TRIGGER IF EXISTS participant_primary_address_BEFORE_DELETE $$
CREATE TRIGGER participant_primary_address_BEFORE_DELETE BEFORE DELETE ON participant_primary_address FOR EACH ROW
BEGIN
  DELETE FROM participant_site
  WHERE participant_id = OLD.participant_id;
END;$$


DROP TRIGGER IF EXISTS participant_primary_address_AFTER_DELETE $$
CREATE TRIGGER participant_primary_address_AFTER_DELETE AFTER DELETE ON participant_primary_address FOR EACH ROW
BEGIN
  CALL update_participant_site_for_participant( OLD.participant_id );
END;$$

DELIMITER ;

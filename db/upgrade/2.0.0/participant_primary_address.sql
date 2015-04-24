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
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
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
      JOIN address AS address1 ON participant.person_id = address1.person_id
      WHERE address1.rank = (
        SELECT MIN( address2.rank )
        FROM address AS address2
        JOIN region ON address2.region_id = region.id
        -- Joining to region_site is used to exclude addresses which are not
        -- in region_site, actual linkage (and language) is irrelevant
        JOIN region_site ON region.id = region_site.region_id
        WHERE address2.active
        AND address1.person_id = address2.person_id
        GROUP BY address2.person_id
      );

    END IF;

  END //
DELIMITER ;

CALL patch_participant_primary_address();
DROP PROCEDURE IF EXISTS patch_participant_primary_address;

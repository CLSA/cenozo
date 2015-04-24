DROP PROCEDURE IF EXISTS patch_participant_first_address;
DELIMITER //
CREATE PROCEDURE patch_participant_first_address()
  BEGIN

    SELECT "Replacing person_first_address view with caching table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.VIEWS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "person_first_address" );
    IF @test = 1 THEN
    
      DROP VIEW IF EXISTS person_first_address;

      CREATE TABLE IF NOT EXISTS person_first_address (
        person_id INT UNSIGNED NOT NULL,
        address_id INT UNSIGNED NULL,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        PRIMARY KEY (person_id),
        INDEX fk_address_id (address_id ASC),
        INDEX fk_person_id (person_id ASC),
        CONSTRAINT fk_person_first_address_person_id
          FOREIGN KEY (person_id)
          REFERENCES person (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_person_first_address_address_id
          FOREIGN KEY (address_id)
          REFERENCES address (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION)
      ENGINE = InnoDB;

      SELECT "Populating person_first_address table" AS "";

      REPLACE INTO person_first_address( person_id, address_id )
      SELECT person.id, address1.id
      FROM person
      JOIN address AS address1 ON person.id = address1.person_id
      WHERE address1.rank = (
        SELECT MIN( address2.rank )
        FROM address AS address2
        WHERE address2.active
        AND address1.person_id = address2.person_id
        AND CASE MONTH( CURRENT_DATE() )
          WHEN 1 THEN address2.january
          WHEN 2 THEN address2.february
          WHEN 3 THEN address2.march
          WHEN 4 THEN address2.april
          WHEN 5 THEN address2.may
          WHEN 6 THEN address2.june
          WHEN 7 THEN address2.july
          WHEN 8 THEN address2.august
          WHEN 9 THEN address2.september
          WHEN 10 THEN address2.october
          WHEN 11 THEN address2.november
          WHEN 12 THEN address2.december
          ELSE 0 END = 1
        GROUP BY address2.person_id
      );

    END IF;

  END //
DELIMITER ;

CALL patch_participant_first_address();
DROP PROCEDURE IF EXISTS patch_participant_first_address;

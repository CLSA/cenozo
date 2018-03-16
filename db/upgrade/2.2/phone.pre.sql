DROP PROCEDURE IF EXISTS patch_phone;
DELIMITER //
CREATE PROCEDURE patch_phone()
  BEGIN

    SET @test = ( 
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "trace" );
    IF @test = 0 THEN

      SELECT "Disabling all phone numbers of participants in trace-based states" AS "";

      DROP TABLE IF EXISTS active_phone;
      CREATE TEMPORARY TABLE active_phone
      SELECT distinct participant_id AS id FROM phone WHERE active = 1;
      ALTER TABLE active_phone ADD INDEX dk_id ( id ); 

      DROP TABLE IF EXISTS has_phone;
      CREATE TEMPORARY TABLE has_phone
      SELECT participant.id, active_phone.id IS NOT NULL AS active
      FROM participant LEFT JOIN active_phone USING( id );
      ALTER TABLE has_phone ADD INDEX dk_id ( id ); 

      DROP TABLE IF EXISTS active_address;
      CREATE TEMPORARY TABLE active_address
      SELECT distinct participant_id AS id FROM address WHERE active = 1;
      ALTER TABLE active_address ADD INDEX dk_id ( id ); 

      DROP TABLE IF EXISTS has_address;
      CREATE TEMPORARY TABLE has_address
      SELECT participant.id, active_address.id IS NOT NULL AS active
      FROM participant LEFT JOIN active_address USING( id ); 
      ALTER TABLE has_address ADD INDEX dk_id ( id ); 

      DROP TABLE IF EXISTS has_contact;
      CREATE TEMPORARY TABLE has_contact
      SELECT id, has_phone.active active_phone, has_address.active active_address
      FROM has_phone JOIN has_address USING ( id ); 
      ALTER TABLE has_contact ADD INDEX dk_id ( id ); 

      UPDATE participant
      JOIN has_contact USING( id )
      JOIN state ON participant.state_id = state.id
      JOIN phone ON participant.id = phone.participant_id
      SET phone.active = 0
      WHERE has_contact.active_phone > 0
      AND has_contact.active_address > 0
      AND participant.exclusion_id IS NULL
      AND state.name IN ( 'site', 'central', 'unreachable' );

    END IF;

  END //
DELIMITER ;

CALL patch_phone();
DROP PROCEDURE IF EXISTS patch_phone;

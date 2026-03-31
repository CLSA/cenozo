CREATE TRIGGER event_AFTER_INSERT
AFTER INSERT ON event FOR EACH ROW
BEGIN
  CALL update_participant_last_event( NEW.participant_id, NEW.event_type_id );
  SET @test = ( SELECT record_address FROM event_type WHERE id = NEW.event_type_id );
  IF @test THEN
    INSERT INTO event_address( event_id, address_id, international, address1, address2, city, region_id, postcode )
    SELECT NEW.id, address.id, international, address1, address2, city, region_id, postcode
    FROM participant_primary_address
    JOIN address ON participant_primary_address.address_id = address.id
    WHERE participant_primary_address.participant_id = NEW.participant_id;
  END IF;
END$$
SELECT "Adding participant.email2 to search parameters" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS search_AFTER_INSERT;
CREATE DEFINER = CURRENT_USER TRIGGER search_AFTER_INSERT AFTER INSERT ON search FOR EACH ROW
BEGIN

  REPLACE INTO search_result( create_timestamp, search_id, participant_id, record_id, subject, column_name, value )

  SELECT NULL, NEW.id, participant.id, participant.id, "participant", "honorific", participant.honorific
  FROM participant 
  WHERE honorific LIKE NEW.word

  UNION SELECT NULL, NEW.id, participant.id, participant.id, "participant", "first_name", participant.first_name
  FROM participant WHERE first_name LIKE NEW.word

  UNION SELECT NULL, NEW.id, participant.id, participant.id, "participant", "other_name", participant.other_name
  FROM participant WHERE other_name LIKE NEW.word

  UNION SELECT NULL, NEW.id, participant.id, participant.id, "participant", "last_name", participant.last_name
  FROM participant WHERE last_name LIKE NEW.word

  UNION SELECT NULL, NEW.id, participant.id, participant.id, "participant", "date_of_birth", participant.date_of_birth
  FROM participant WHERE date_of_birth LIKE NEW.word

  UNION SELECT NULL, NEW.id, participant.id, participant.id, "participant", "email", participant.email
  FROM participant WHERE email LIKE NEW.word

  UNION SELECT NULL, NEW.id, participant.id, participant.id, "participant", "email2", participant.email2
  FROM participant WHERE email2 LIKE NEW.word

  UNION SELECT NULL, NEW.id, alternate.participant_id, alternate.id, "alternate", "first_name", alternate.first_name
  FROM alternate WHERE first_name LIKE NEW.word

  UNION SELECT NULL, NEW.id, alternate.participant_id, alternate.id, "alternate", "last_name", alternate.last_name
  FROM alternate WHERE last_name LIKE NEW.word

  UNION SELECT NULL, NEW.id, alternate.participant_id, alternate.id, "alternate", "association", alternate.association
  FROM alternate WHERE association LIKE NEW.word

  UNION SELECT NULL, NEW.id, consent.participant_id, consent.id, "consent", "note",
    IF( CHAR_LENGTH( note ) > 255, CONCAT( SUBSTRING( note, 1, 252 ), "..." ), note ) 
  FROM consent WHERE note LIKE NEW.word

  UNION SELECT NULL, NEW.id, hin.participant_id, hin.id, "hin", "code", hin.code
  FROM hin WHERE code LIKE NEW.word

  UNION SELECT NULL, NEW.id, address.participant_id, address.id, "address", "address1",
    IF( CHAR_LENGTH( address1 ) > 255, CONCAT( SUBSTRING( address1, 1, 252 ), "..." ), address1 ) 
  FROM address WHERE address1 LIKE NEW.word AND participant_id IS NOT NULL

  UNION SELECT NULL, NEW.id, alternate.participant_id, address.id, "address", "address1",
    IF( CHAR_LENGTH( address1 ) > 255, CONCAT( SUBSTRING( address1, 1, 252 ), "..." ), address1 ) 
  FROM address 
  JOIN alternate ON address.alternate_id = alternate.id 
  WHERE address1 LIKE NEW.word

  UNION SELECT NULL, NEW.id, address.participant_id, address.id, "address", "address2",
    IF( CHAR_LENGTH( address2 ) > 255, CONCAT( SUBSTRING( address2, 1, 252 ), "..." ), address2 ) 
  FROM address WHERE address2 LIKE NEW.word AND participant_id IS NOT NULL

  UNION SELECT NULL, NEW.id, alternate.participant_id, address.id, "address", "address2",
    IF( CHAR_LENGTH( address2 ) > 255, CONCAT( SUBSTRING( address2, 1, 252 ), "..." ), address2 ) 
  FROM address 
  JOIN alternate ON address.alternate_id = alternate.id 
  WHERE address2 LIKE NEW.word

  UNION SELECT NULL, NEW.id, address.participant_id, address.id, "address", "city", address.city
  FROM address WHERE city LIKE NEW.word AND participant_id IS NOT NULL

  UNION SELECT NULL, NEW.id, alternate.participant_id, address.id, "address", "city", address.city
  FROM address 
  JOIN alternate ON address.alternate_id = alternate.id 
  WHERE city LIKE NEW.word

  UNION SELECT NULL, NEW.id, address.participant_id, address.id, "address", "postcode", address.postcode
  FROM address WHERE postcode LIKE NEW.word AND participant_id IS NOT NULL

  UNION SELECT NULL, NEW.id, alternate.participant_id, address.id, "address", "postcode", address.postcode
  FROM address 
  JOIN alternate ON address.alternate_id = alternate.id 
  WHERE postcode LIKE NEW.word

  UNION SELECT NULL, NEW.id, address.participant_id, address.id, "address", "note",
    IF( CHAR_LENGTH( note ) > 255, CONCAT( SUBSTRING( note, 1, 252 ), "..." ), note ) 
  FROM address WHERE note LIKE NEW.word AND participant_id IS NOT NULL

  UNION SELECT NULL, NEW.id, alternate.participant_id, address.id, "address", "note",
    IF( CHAR_LENGTH( note ) > 255, CONCAT( SUBSTRING( note, 1, 252 ), "..." ), note ) 
  FROM address 
  JOIN alternate ON address.alternate_id = alternate.id 
  WHERE note LIKE NEW.word

  UNION SELECT NULL, NEW.id, phone.participant_id, phone.id, "phone", "number", phone.number
  FROM phone WHERE number LIKE NEW.word AND participant_id IS NOT NULL

  UNION SELECT NULL, NEW.id, alternate.participant_id, phone.id, "phone", "number", phone.number
  FROM phone 
  JOIN alternate ON phone.alternate_id = alternate.id 
  WHERE number LIKE NEW.word

  UNION SELECT NULL, NEW.id, phone.participant_id, phone.id, "phone", "note",
    IF( CHAR_LENGTH( note ) > 255, CONCAT( SUBSTRING( note, 1, 252 ), "..." ), note ) 
  FROM phone WHERE note LIKE NEW.word AND participant_id IS NOT NULL

  UNION SELECT NULL, NEW.id, alternate.participant_id, phone.id, "phone", "note",
    IF( CHAR_LENGTH( note ) > 255, CONCAT( SUBSTRING( note, 1, 252 ), "..." ), note ) 
  FROM phone 
  JOIN alternate ON phone.alternate_id = alternate.id 
  WHERE note LIKE NEW.word

  UNION SELECT NULL, NEW.id, note.participant_id, note.id, "note", "note",
    IF( CHAR_LENGTH( note ) > 255, CONCAT( SUBSTRING( note, 1, 252 ), "..." ), note ) 
  FROM note WHERE note LIKE NEW.word AND participant_id IS NOT NULL

  UNION SELECT NULL, NEW.id, alternate.participant_id, note.id, "note", "note",
    IF( CHAR_LENGTH( note ) > 255, CONCAT( SUBSTRING( note, 1, 252 ), "..." ), note ) 
  FROM note 
  JOIN alternate ON note.alternate_id = alternate.id 
  WHERE note LIKE NEW.word

  UNION SELECT NULL, NEW.id, event.participant_id, event_address.id, "event_address", "address1",
    IF( CHAR_LENGTH( address1 ) > 255, CONCAT( SUBSTRING( address1, 1, 252 ), "..." ), address1 ) 
  FROM event_address 
  JOIN event ON event_address.event_id = event.id 
  WHERE address1 LIKE NEW.word

  UNION SELECT NULL, NEW.id, event.participant_id, event_address.id, "event_address", "address2",
    IF( CHAR_LENGTH( address2 ) > 255, CONCAT( SUBSTRING( address2, 1, 252 ), "..." ), address2 ) 
  FROM event_address 
  JOIN event ON event_address.event_id = event.id 
  WHERE address2 LIKE NEW.word

  UNION SELECT NULL, NEW.id, event.participant_id, event_address.id, "event_address", "city", event_address.city
  FROM event_address 
  JOIN event ON event_address.event_id = event.id 
  WHERE city LIKE NEW.word

  UNION SELECT NULL, NEW.id, event.participant_id, event_address.id, "event_address", "postcode", event_address.postcode
  FROM event_address 
  JOIN event ON event_address.event_id = event.id 
  WHERE postcode LIKE NEW.word;

END$$

DELIMITER ;

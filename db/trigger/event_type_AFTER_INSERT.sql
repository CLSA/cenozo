CREATE TRIGGER event_type_AFTER_INSERT
AFTER INSERT ON event_type FOR EACH ROW
BEGIN
  INSERT INTO participant_last_event( participant_id, event_type_id, event_id )
  SELECT participant.id, NEW.id, NULL
  FROM participant;

  INSERT INTO role_has_event_type( role_id, event_type_id )
  SELECT role.id, NEW.id
  FROM role
  WHERE name = "administrator";
END$$

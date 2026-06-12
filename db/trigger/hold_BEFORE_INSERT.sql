CREATE TRIGGER hold_BEFORE_INSERT BEFORE INSERT ON hold FOR EACH ROW
BEGIN

  SET @hold_type = NULL;
  SELECT hold_type.type INTO @hold_type
  FROM hold_type
  WHERE id = NEW.hold_type_id;

  SELECT exclusion_id, hold_type.type, hold_type.id INTO @exclusion_id, @last_hold_type, @last_hold_type_id
  FROM participant
  JOIN participant_last_hold ON participant.id = participant_last_hold.participant_id
  LEFT JOIN hold ON participant_last_hold.hold_id = hold.id
  LEFT JOIN hold_type ON hold.hold_type_id = hold_type.id
  WHERE participant.id = NEW.participant_id;

  IF ( @exclusion_id IS NOT NULL ) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = "Cannot add row: participant.excluded_id is not null";
  ELSE
    IF ( NEW.hold_type_id <=> @last_hold_type_id ) OR
       ( @hold_type IS NOT NULL AND 'final' != @hold_type AND 'final' <=> @last_hold_type ) THEN
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = "Cannot add row: conflict with last hold type";
    END IF;
  END IF;
END ;;

CREATE TRIGGER proxy_BEFORE_INSERT BEFORE INSERT ON proxy FOR EACH ROW
BEGIN

  SET @proxy_type = NULL;
  SELECT proxy_type.name INTO @proxy_type
  FROM proxy_type
  WHERE id = NEW.proxy_type_id;

  SELECT exclusion_id, hold_type.type, proxy_type.name INTO @exclusion_id, @last_hold_type, @last_proxy_type
  FROM participant
  JOIN participant_last_hold
    ON participant.id = participant_last_hold.participant_id
  LEFT JOIN hold
    ON participant_last_hold.hold_id = hold.id
  LEFT JOIN hold_type
    ON hold.hold_type_id = hold_type.id
  JOIN participant_last_proxy
    ON participant.id = participant_last_proxy.participant_id
  LEFT JOIN proxy
    ON participant_last_proxy.proxy_id = proxy.id
  LEFT JOIN proxy_type
    ON proxy.proxy_type_id = proxy_type.id
  WHERE participant.id = NEW.participant_id;

  IF ( @exclusion_id IS NOT NULL ) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = "Cannot add row: participant.excluded_id is not null";
  ELSE
    IF ( 'final' <=> @last_hold_type ) THEN
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = "Cannot add row: participant's last hold is final";
       ELSE
      IF ( @proxy_type <=> @last_proxy_type ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = "Cannot add row: conflict with last proxy type";
      END IF;
    END IF;
  END IF;
END ;;
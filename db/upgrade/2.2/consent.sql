DELIMITER $$
    
DROP TRIGGER IF EXISTS consent_BEFORE_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER consent_BEFORE_UPDATE BEFORE UPDATE ON consent FOR EACH ROW
BEGIN
  -- update any participation consent record's associated hold
  SET @test = (
    SELECT consent_type.name
    FROM consent_type
    WHERE id = NEW.consent_type_id );
  IF @test = "participation" THEN
    IF NEW.datetime != OLD.datetime OR NEW.accept != OLD.accept THEN
      CALL get_hold_from_consent( OLD.id, @hold_id );
      IF @hold_id IS NOT NULL THEN
        UPDATE hold, hold_type
        SET hold.datetime = NEW.datetime,
            hold.hold_type_id = IF( NEW.accept, NULL, hold_type.id )
        WHERE hold.id = @hold_id
        AND hold_type.type = "final"
        AND hold_type.name = "withdrawn";
        CALL remove_duplicate_holds( NEW.participant_id );
      END IF;
    END IF;
  END IF;
END$$

DROP TRIGGER IF EXISTS consent_BEFORE_DELETE $$
CREATE DEFINER = CURRENT_USER TRIGGER consent_BEFORE_DELETE BEFORE DELETE ON consent FOR EACH ROW
BEGIN
  -- remove a participation consent record's associated hold
  SET @test = (
    SELECT consent_type.name
    FROM consent_type
    WHERE id = OLD.consent_type_id );
  IF @test = "participation" THEN
    CALL get_hold_from_consent( OLD.id, @hold_id );
    IF @hold_id IS NOT NULL THEN
      DELETE FROM hold WHERE id = @hold_id;
      CALL remove_duplicate_holds( OLD.participant_id );
    END IF;
  END IF;
END$$

DELIMITER ;

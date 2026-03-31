CREATE TRIGGER consent_BEFORE_DELETE
BEFORE DELETE ON consent FOR EACH ROW
BEGIN
  SET @test = (
    SELECT consent_type.name
    FROM consent_type
    WHERE id = OLD.consent_type_id );
  IF @test = "participation" THEN
    CALL get_hold_from_consent( OLD.id, @hold_id );
    IF @hold_id IS NOT NULL THEN
      DELETE FROM hold WHERE id = @hold_id;
      CALL remove_duplicate_hold( OLD.participant_id );
    END IF;
  END IF;
END$$

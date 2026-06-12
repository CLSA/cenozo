CREATE TRIGGER equipment_loan_BEFORE_UPDATE BEFORE UPDATE ON equipment_loan FOR EACH ROW
BEGIN
  IF( NEW.lost AND NEW.end_datetime IS NULL AND OLD.end_datetime IS NULL ) THEN
    SET NEW.end_datetime = UTC_TIMESTAMP();
  END IF;
END ;;

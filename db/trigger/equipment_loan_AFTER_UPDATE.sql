CREATE TRIGGER equipment_loan_AFTER_UPDATE AFTER UPDATE ON equipment_loan FOR EACH ROW
BEGIN
  CALL update_equipment_last_loan( NEW.equipment_id );
END ;;
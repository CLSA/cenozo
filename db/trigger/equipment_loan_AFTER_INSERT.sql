CREATE TRIGGER equipment_loan_AFTER_INSERT AFTER INSERT ON equipment_loan FOR EACH ROW
BEGIN
  CALL update_equipment_last_loan( NEW.equipment_id );
END ;;

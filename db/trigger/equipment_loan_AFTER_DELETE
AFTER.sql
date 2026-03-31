CREATE TRIGGER equipment_loan_AFTER_DELETE
AFTER DELETE ON equipment_loan FOR EACH ROW
BEGIN
  CALL update_equipment_last_loan( OLD.equipment_id );
END$$
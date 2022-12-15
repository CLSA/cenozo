SELECT "Creating new update_equipment_last_loan procedure" AS "";

DELIMITER $$

DROP PROCEDURE IF EXISTS update_equipment_last_loan;
CREATE DEFINER=CURRENT_USER PROCEDURE update_equipment_last_loan(IN proc_equipment_id INT(10) UNSIGNED)
BEGIN
  REPLACE INTO equipment_last_loan( equipment_id, equipment_loan_id )
  SELECT equipment.id, equipment_loan.id
  FROM equipment
  LEFT JOIN equipment_loan ON equipment.id = equipment_loan.equipment_id
  AND equipment_loan.start_datetime <=> (
    SELECT MAX( start_datetime )
    FROM equipment_loan
    WHERE equipment.id = equipment_loan.equipment_id
    GROUP BY equipment_loan.equipment_id
    LIMIT 1
  )
  WHERE equipment.id = proc_equipment_id;

  UPDATE equipment
  JOIN equipment_last_loan ON equipment.id = equipment_last_loan.equipment_id
  LEFT JOIN equipment_loan ON equipment_last_loan.equipment_loan_id = equipment_loan.id
  SET equipment.status = IF(
    equipment_loan.id IS NULL,
    'new',
    IF(
      equipment_loan.end_datetime IS NULL,
      'loaned',
      IF( equipment_loan.lost, 'lost', 'returned' )
    )
  )
  WHERE equipment.id = proc_equipment_id;
END$$

DELIMITER ;

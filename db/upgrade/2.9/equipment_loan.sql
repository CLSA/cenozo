DROP PROCEDURE IF EXISTS patch_equipment_loan;
DELIMITER //
CREATE PROCEDURE patch_equipment_loan()
  BEGIN

    SELECT "Adding unique key to equipment_loan table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE table_schema = DATABASE()
    AND table_name = "equipment_loan"
    AND constraint_name = "uq_participant_id_equipment_id_start_datetime";

    IF 0 = @total THEN
      -- first eliminate duplcates
      CREATE TEMPORARY TABLE keep_record
      (
        INDEX dk_id (id),
        INDEX dk_participant_id_equipment_id_start_datetime (participant_id, equipment_id, start_datetime)
      )
      SELECT MAX(id) AS id, participant_id, equipment_id, start_datetime
      FROM equipment_loan
      GROUP BY participant_id, equipment_id, start_datetime
      HAVING COUNT(*) > 1;

      CREATE TEMPORARY TABLE delete_record
      (INDEX dk_id (id))
      SELECT equipment_loan.id
      FROM equipment_loan
      JOIN keep_record USING( participant_id, equipment_id, start_datetime )
      WHERE equipment_loan.id != keep_record.id;

      DELETE FROM equipment_loan WHERE id IN ( SELECT id FROM delete_record );

      ALTER TABLE equipment_loan
      ADD UNIQUE KEY uq_participant_id_equipment_id_start_datetime (participant_id, equipment_id, start_datetime); 
    END IF;

  END //
DELIMITER ;

CALL patch_equipment_loan();
DROP PROCEDURE IF EXISTS patch_equipment_loan;

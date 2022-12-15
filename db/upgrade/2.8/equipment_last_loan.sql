DROP PROCEDURE IF EXISTS patch_equipment_last_loan;
DELIMITER //
CREATE PROCEDURE patch_equipment_last_loan()
  BEGIN

    SELECT COUNT(*) INTO @test
    FROM information_schema.TABLES
    WHERE table_schema = DATABASE()
    AND table_name = "equipment_last_loan";

    IF 0 = @test THEN

      SELECT "Creating new equipment_last_loan table" AS "";

      CREATE TABLE IF NOT EXISTS equipment_last_loan (
        equipment_id INT UNSIGNED NOT NULL,
        equipment_loan_id INT UNSIGNED NULL DEFAULT NULL,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        PRIMARY KEY (equipment_id),
        INDEX fk_equipment_loan_id (equipment_loan_id ASC),
        CONSTRAINT fk_equipment_last_loan_equipment_id
          FOREIGN KEY (equipment_id)
          REFERENCES equipment (id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_equipment_last_loan_equipment_loan_id
          FOREIGN KEY (equipment_loan_id)
          REFERENCES equipment_loan (id)
          ON DELETE CASCADE
          ON UPDATE CASCADE)
      ENGINE = InnoDB;

      SELECT "Populating equipment_last_loan table" AS "";

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
      );

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
      );
    END IF;

  END //
DELIMITER ;

CALL patch_equipment_last_loan();
DROP PROCEDURE IF EXISTS patch_equipment_last_loan;

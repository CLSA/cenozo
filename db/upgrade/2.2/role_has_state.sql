DROP PROCEDURE IF EXISTS patch_role_has_state;
DELIMITER //
CREATE PROCEDURE patch_role_has_state()
  BEGIN

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "role_has_state" );
    IF @test = 1 THEN

      SELECT "Transferring role access to state to hold_type" AS "";

      INSERT IGNORE INTO role_has_hold_type( role_id, hold_type_id )
      SELECT role_id, hold_type.id
      FROM role_has_state
      JOIN state ON role_has_state.state_id = state.id
      JOIN hold_type USING( name );

      SELECT "Removing defunct role_has_state table" AS "";

      DROP TABLE role_has_state;

    END IF;

  END //
DELIMITER ;

CALL patch_role_has_state();
DROP PROCEDURE IF EXISTS patch_role_has_state;

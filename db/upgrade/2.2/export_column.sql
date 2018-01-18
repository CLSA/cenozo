DROP PROCEDURE IF EXISTS patch_export_column;
DELIMITER //
CREATE PROCEDURE patch_export_column()
  BEGIN

    SET @test = ( 
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "state" );
    IF @test = 1 THEN

      SELECT "Converting export_columns from state to hold/proxy/trace" AS "";

      DELETE FROM export_column
      WHERE table_name = "participant"
      AND column_name = "active";

      UPDATE export_column
      JOIN export_restriction USING( export_id )
      SET export_column.table_name = "hold", export_column.column_name = "hold_type_id"
      WHERE export_column.table_name = "participant"
      AND export_column.column_name = "state_id"
      AND export_restriction.table_name = "hold"
      AND export_restriction.column_name = "hold_type_id";

      UPDATE export_column
      JOIN export_restriction USING( export_id )
      SET export_column.table_name = "proxy", export_column.column_name = "proxy_type_id"
      WHERE export_column.table_name = "participant"
      AND export_column.column_name = "state_id"
      AND export_restriction.table_name = "proxy"
      AND export_restriction.column_name = "proxy_type_id";

      UPDATE export_column
      JOIN export_restriction USING( export_id )
      SET export_column.table_name = "trace", export_column.column_name = "trace_type_id"
      WHERE export_column.table_name = "participant"
      AND export_column.column_name = "state_id"
      AND export_restriction.table_name = "trace"
      AND export_restriction.column_name = "trace_type_id";

      UPDATE export_column
      SET column_name = "status"
      WHERE table_name = "participant"
      AND column_name = "state_id";

    END IF;

  END //
DELIMITER ;

CALL patch_export_column();
DROP PROCEDURE IF EXISTS patch_export_column;

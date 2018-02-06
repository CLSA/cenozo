DROP PROCEDURE IF EXISTS patch_export_restriction;
DELIMITER //
CREATE PROCEDURE patch_export_restriction()
  BEGIN

    SET @test = ( 
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "state" );
    IF @test = 1 THEN

      SELECT "Converting export_restrictions from state to hold/proxy/trace" AS "";

      -- convert state is null to hold is null
      UPDATE export_restriction
      SET table_name = "hold", column_name = "hold_type_id"
      WHERE table_name = "participant"
      AND column_name = "state_id"
      AND value IS NULL;

      -- convert state is hold-type to hold is hold-type
      UPDATE export_restriction
      JOIN state ON export_restriction.value = state.id
      JOIN hold_type ON state.name = hold_type.name
      SET table_name = "hold", column_name = "hold_type_id", value = hold_type.id
      WHERE table_name = "participant"
      AND column_name = "state_id";

      -- delete participant.active
      DELETE FROM export_restriction
      WHERE table_name = "participant"
      AND column_name = "active";

      -- convert state is proxy-type to proxy is proxy-type
      UPDATE export_restriction
      JOIN state ON export_restriction.value = state.id
      JOIN proxy_type ON state.name = proxy_type.name
      SET table_name = "proxy", column_name = "proxy_type_id", value = proxy_type.id
      WHERE table_name = "participant"
      AND column_name = "state_id";

      -- convert state is trace-type to trace is trace-type
      UPDATE export_restriction
      JOIN state ON export_restriction.value = state.id
      JOIN trace_type ON state.name = trace_type.name
      SET table_name = "trace", column_name = "trace_type_id", value = trace_type.id
      WHERE table_name = "participant"
      AND column_name = "state_id";

    END IF;

  END //
DELIMITER ;

CALL patch_export_restriction();
DROP PROCEDURE IF EXISTS patch_export_restriction;

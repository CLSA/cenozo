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

-- convert participant.active = 0 to hold is hold-type
UPDATE export_restriction, hold_type
SET table_name = "hold", column_name = "hold_type_id", value = hold_type.id
WHERE table_name = "participant"
AND column_name = "active"
AND value = 1
AND hold_type.name = "Deactivated";

-- delete participant.active = 1
DELETE FROM export_restriction
WHERE table_name = "participant"
AND column_name = "active"
AND value = 0;

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

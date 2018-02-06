-- Patch to upgrade database to version 2.2

SET AUTOCOMMIT=0;

SOURCE application.sql
SOURCE event_type.sql
SOURCE site.sql

SOURCE exclusion.sql
SOURCE participant.exclusion.sql
SOURCE rename_states.sql
SOURCE phone.pre.sql

SOURCE hold_type.sql
SOURCE hold.sql
SOURCE get_hold_from_consent.sql
SOURCE remove_duplicate_hold.sql

SOURCE proxy_type.sql
SOURCE proxy.sql

SOURCE trace_type.sql
SOURCE trace.sql

SOURCE participant.state.sql
SOURCE overview.sql
SOURCE role_has_overview.sql

SOURCE export_restriction.sql
SOURCE export_column.sql

SOURCE role_has_hold_type.sql
SOURCE role_has_state.sql
SOURCE state.sql

SOURCE participant_last_hold.sql
SOURCE update_participant_last_hold.sql
SOURCE participant_last_proxy.sql
SOURCE update_participant_last_proxy.sql
SOURCE participant_last_trace.sql
SOURCE update_participant_last_trace.sql
SOURCE contact_changed.sql
SOURCE consent.sql
SOURCE address.sql
SOURCE phone.sql

SOURCE hold.post.sql
SOURCE proxy.post.sql
SOURCE trace.post.sql

SOURCE update_version_number.sql

COMMIT;

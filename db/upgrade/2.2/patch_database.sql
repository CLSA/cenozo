-- Patch to upgrade database to version 2.2

SET AUTOCOMMIT=0;

SOURCE enrollment.sql
SOURCE participant.enrollment.sql
SOURCE rename_states.sql

SOURCE hold_type.sql
SOURCE hold.sql
SOURCE get_hold_from_consent.sql
SOURCE remove_duplicate_holds.sql
SOURCE participant.state.sql

SOURCE role_has_hold_type.sql
SOURCE role_has_state.sql
SOURCE state.sql

SOURCE participant_last_hold.sql
SOURCE update_participant_last_hold.sql
SOURCE consent.sql
SOURCE hold.post.sql

SOURCE update_version_number.sql

COMMIT;

-- Patch to upgrade database to version 2.0.0

SET AUTOCOMMIT=0;

SOURCE age_group.sql
SOURCE collection.sql
SOURCE state.sql
SOURCE person_first_address.sql
SOURCE role.sql
SOURCE application_type.sql
SOURCE application.sql
SOURCE application_has_participant.sql
SOURCE application_has_cohort.sql
SOURCE application_has_role.sql
SOURCE application_has_collection.sql
SOURCE activity.sql
SOURCE user_has_application.sql
SOURCE user_has_language.sql
SOURCE site.sql
SOURCE application_has_site.sql
SOURCE jurisdiction.sql
SOURCE region_site.sql
SOURCE user.sql
SOURCE access.sql
SOURCE address.sql
SOURCE event_address.sql
SOURCE consent_type.sql
SOURCE consent.sql
SOURCE hin.sql
SOURCE event.sql
SOURCE phone.sql
SOURCE person_note.sql
SOURCE alternate.sql
SOURCE next_of_kin.sql
SOURCE availability_type.sql
SOURCE participant.sql
SOURCE person.sql
SOURCE quota.sql
SOURCE system_message.sql
SOURCE script.sql
SOURCE application_has_script.sql
SOURCE event_type.sql
SOURCE report_type.sql
SOURCE report_restriction.sql
SOURCE report_schedule.sql
SOURCE report_schedule_has_report_restriction.sql
SOURCE report.sql
SOURCE report_has_report_restriction.sql
SOURCE application_has_report_type.sql
SOURCE role_has_report_type.sql
SOURCE search.sql
SOURCE search_result.sql
SOURCE form_type.sql
SOURCE form.sql
SOURCE form_association.sql

SOURCE update_alternate_first_address.sql
SOURCE update_participant_first_address.sql
SOURCE update_participant_primary_address.sql
SOURCE update_participant_site_for_participant.sql
SOURCE update_participant_site_for_jurisdiction.sql
SOURCE update_participant_site_for_region_site.sql
SOURCE update_participant_last_hin.sql
SOURCE update_participant_last_event.sql
SOURCE update_participant_last_events.sql
SOURCE update_participant_last_consent.sql
SOURCE update_participant_last_consents.sql
SOURCE update_participant_last_written_consent.sql
SOURCE update_participant_last_written_consents.sql

SOURCE participant_default_site.sql
SOURCE participant_preferred_site.sql
SOURCE alternate_first_address.sql
SOURCE participant_first_address.sql
SOURCE participant_last_hin.sql
SOURCE participant_last_event.sql
SOURCE participant_last_written_consent.sql
SOURCE participant_last_consent.sql
SOURCE alternate_first_address.sql
SOURCE participant_first_address.sql
SOURCE participant_primary_address.sql

SOURCE address.sql
SOURCE phone.sql
SOURCE participant_site.sql

SOURCE table_character_sets.sql
SOURCE column_character_sets.sql

SOURCE update_version_number.sql

COMMIT;

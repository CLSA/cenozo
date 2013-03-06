-- 
-- Cross-application database amalgamation redesign
-- This script converts pre version 0.2 databases to the new amalgamated design
-- 

DROP PROCEDURE IF EXISTS convert_database;
DELIMITER //
CREATE PROCEDURE convert_database()
  BEGIN

    -- determine the database names
    SET @cenozo = DATABASE();
    SET @mastodon = CONCAT( SUBSTRING( @cenozo, 1, LOCATE( 'cenozo', @cenozo ) - 1 ), 'mastodon' );
    SET @sabretooth = CONCAT( SUBSTRING( @cenozo, 1, LOCATE( 'cenozo', @cenozo ) - 1 ), 'sabretooth' );
    SET @beartooth = CONCAT( SUBSTRING( @cenozo, 1, LOCATE( 'cenozo', @cenozo ) - 1 ), 'beartooth' );

    -- user ----------------------------------------------------------------------------------------
    SELECT "Processing user" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".user( id, update_timestamp, create_timestamp, name, ",
                               "first_name, last_name, active, language ) ",
      "SELECT muser.id, muser.update_timestamp, muser.create_timestamp, muser.name,
              muser.first_name, muser.last_name, muser.active, IFNULL( buser.language, 'en' ) ",
      "FROM ", @mastodon, ".user muser ",
      "LEFT JOIN ", @beartooth, ".user buser ON muser.name = buser.name" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- role ----------------------------------------------------------------------------------------
    SELECT "Processing role" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".role SELECT * FROM ", @mastodon, ".role" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- cohort --------------------------------------------------------------------------------------
    SELECT "Processing cohort" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".cohort ( name ) VALUES ",
      "( 'comprehensive' ), ",
      "( 'tracking' )" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- service -------------------------------------------------------------------------------------
    SELECT "Processing service" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".service( name, title, version ) VALUES ",
      "( 'mastodon', 'Mastodon', '1.2.0' ), ",
      "( 'beartooth', 'Beartooth', '1.1.0' ), ",
      "( 'sabretooth', 'Sabretooth', '1.2.0' )" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- user_has_service ----------------------------------------------------------------------------
    SELECT "Processing user_has_service" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".user_has_service( user_id, service_id, theme ) ",
      "SELECT user.id, service.id, muser.theme ",
      "FROM ", @cenozo, ".service, ", @cenozo, ".user ",
      "JOIN ", @mastodon, ".user muser ON user.name = muser.name ",
      "WHERE service.title = 'Mastodon' ",
      "AND muser.theme IS NOT NULL " );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".user_has_service( user_id, service_id, theme ) ",
      "SELECT user.id, service.id, buser.theme ",
      "FROM ", @cenozo, ".service, ", @cenozo, ".user ",
      "JOIN ", @beartooth, ".user buser ON user.name = buser.name ",
      "WHERE service.title = 'Beartooth' ",
      "AND buser.theme IS NOT NULL " );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".user_has_service( user_id, service_id, theme ) ",
      "SELECT user.id, service.id, suser.theme ",
      "FROM ", @cenozo, ".service, ", @cenozo, ".user ",
      "JOIN ", @sabretooth, ".user suser ON user.name = suser.name ",
      "WHERE service.title = 'Sabretooth' ",
      "AND suser.theme IS NOT NULL " );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- service_has_role ----------------------------------------------------------------------------
    SELECT "Processing service_has_role" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".service_has_role( service_id, role_id ) ",
      "SELECT service.id, role.id ",
      "FROM ", @cenozo, ".service, ", @cenozo, ".role ",
      "WHERE service.title = 'Mastodon' ",
      "AND role.name IN ( 'administrator', 'coordinator', 'interviewer', 'onyx', 'opal', ",
                         "'operator', 'supervisor', 'typist' ) UNION ",
      "SELECT service.id, role.id ",
      "FROM ", @cenozo, ".service, ", @cenozo, ".role ",
      "WHERE service.title = 'Beartooth' ",
      "AND role.name IN ( 'administrator', 'coordinator', 'interviewer', 'onyx' ) UNION ",
      "SELECT service.id, role.id ",
      "FROM ", @cenozo, ".service, ", @cenozo, ".role ",
      "WHERE service.title LIKE 'Sabretooth%' ",
      "AND role.name IN ( 'administrator', 'opal', 'operator', 'supervisor' )" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- site ----------------------------------------------------------------------------------------
    SELECT "Processing site" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".site( id, update_timestamp, create_timestamp, name, timezone, service_id ) ",
      "SELECT id, update_timestamp, create_timestamp, name, timezone, IF( cohort = 'tracking', 3, 2 ) ",
      "FROM ", @mastodon, ".site" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- region --------------------------------------------------------------------------------------
    SELECT "Processing region" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".region SELECT * FROM ", @mastodon, ".region" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- finish populating site ----------------------------------------------------------------------
    SELECT "Processing finish populating site" AS "";
    SET @sql = CONCAT(
      "UPDATE ", @cenozo, ".site, ", @beartooth, ".site bsite, ", @beartooth, ".region bregion, ", @cenozo, ".region ",
      "SET site.title = bsite.institution, ",
      "site.phone_number = bsite.phone_number, ",
      "site.address1 = bsite.address1, ",
      "site.address2 = bsite.address2, ",
      "site.city = bsite.city, ",
      "site.region_id = region.id, ",
      "site.postcode = bsite.postcode ",
      "WHERE site.service_id = ( SELECT id FROM ", @cenozo, ".service WHERE title = 'Beartooth' ) ",
      "AND site.name = bsite.name ",
      "AND bsite.region_id = bregion.id ",
      "AND bregion.name = region.name" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- access --------------------------------------------------------------------------------------
    SELECT "Processing access" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".access SELECT * FROM ", @mastodon, ".access" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- system_message ------------------------------------------------------------------------------
    SELECT "Processing system_message" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".system_message( update_timestamp, create_timestamp, service_id, ",
                                         "site_id, role_id, title, note ) ",
      "SELECT msystem_message.update_timestamp, msystem_message.create_timestamp, this_service.id, ",
             "msystem_message.site_id, msystem_message.role_id, msystem_message.title, msystem_message.note ",
      "FROM ", @cenozo, ".service this_service, ", @mastodon, ".system_message msystem_message ",
      "WHERE this_service.title = 'Mastodon'" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".system_message( update_timestamp, create_timestamp, service_id, ",
                                         "site_id, role_id, title, note ) ",
      "SELECT ssystem_message.update_timestamp, ssystem_message.create_timestamp, this_service.id, ",
             "site.id, role.id, ssystem_message.title, ssystem_message.note ",
      "FROM ", @cenozo, ".service this_service, ", @sabretooth, ".system_message ssystem_message ",
      "LEFT JOIN ", @sabretooth, ".site ssite ON ssystem_message.site_id = ssite.id ",
      "LEFT JOIN ", @cenozo, ".site ON ssite.name = site.name ",
      "LEFT JOIN ", @sabretooth, ".role srole ON ssystem_message.role_id = srole.id ",
      "LEFT JOIN ", @cenozo, ".role ON srole.name = role.name ",
      "WHERE this_service.title = 'Sabretooth'" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".system_message( update_timestamp, create_timestamp, service_id, ",
                                         "site_id, role_id, title, note ) ",
      "SELECT  bsystem_message.update_timestamp, bsystem_message.create_timestamp, this_service.id, ",
              "site.id, role.id, bsystem_message.title, bsystem_message.note ",
      "FROM ", @cenozo, ".service this_service, ", @beartooth, ".system_message bsystem_message ",
      "LEFT JOIN ", @beartooth, ".site bsite ON bsystem_message.site_id = bsite.id ",
      "LEFT JOIN ", @cenozo, ".site ON bsite.name = site.name ",
      "LEFT JOIN ", @beartooth, ".role brole ON bsystem_message.role_id = brole.id ",
      "LEFT JOIN ", @cenozo, ".role ON brole.name = role.name ",
      "WHERE this_service.title = 'Beartooth'" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- postcode ------------------------------------------------------------------------------------
    SELECT "Processing postcode" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".postcode SELECT * FROM ", @mastodon, ".postcode" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- person --------------------------------------------------------------------------------------
    SELECT "Processing person" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".person SELECT * FROM ", @mastodon, ".person" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- address -------------------------------------------------------------------------------------
    SELECT "Processing address" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".address SELECT * FROM ", @mastodon, ".address" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- age_group -----------------------------------------------------------------------------------
    SELECT "Processing age_group" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".age_group SELECT * FROM ", @mastodon, ".age_group" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- source --------------------------------------------------------------------------------------
    SELECT "Processing source" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".source SELECT * FROM ", @mastodon, ".source" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- participant ---------------------------------------------------------------------------------
    SELECT "Processing participant" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".participant( id, update_timestamp, create_timestamp, person_id, active, uid, ",
                                      "source_id, cohort_id, first_name, last_name, gender, date_of_birth, ",
                                      "age_group_id, status, language, use_informant, email ) ",
      "SELECT mp.id, mp.update_timestamp, mp.create_timestamp, mp.person_id, mp.active, mp.uid, ",
             "mp.source_id, cohort.id, mp.first_name, mp.last_name, mp.gender, mp.date_of_birth, ",
             "mp.age_group_id, mp.status, mp.language, mp.use_informant, mp.email ",
      "FROM ", @mastodon, ".participant mp ",
      "JOIN ", @cenozo, ".cohort ON mp.cohort = cohort.name" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- event_type ----------------------------------------------------------------------------------
    SELECT "Processing event_type" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".event_type( name, description ) VALUES ",
      "( 'completed pilot interview', 'Pilot interview completed (for StatsCan tracking participants only).' ), ",
      "( 'imported by rdd', 'Imported by random digit dialing import (for RDD participants only).' ), ",
      "( 'consent to contact received', 'Consent to contact form received (dated by the participant).' ), ",
      "( 'consent for proxy received', 'Consent for proxy form received (dated by the participant).' ), ",
      "( 'package mailed', 'Information package mailed to participant (dated by mailout report).' ), ",
      "( 'first attempt (Baseline)', 'First attempt to contact (for the baseline interview).' ), ",
      "( 'reached (Baseline)', 'The participant was first reached (for the baseline interview).' ), ",
      "( 'completed (Baseline)', 'Interview completed (for the baseline interview).' ), ",
      "( 'first attempt (Baseline Home)', 'First attempt to contact (for the baseline home interview).' ), ",
      "( 'reached (Baseline Home)', 'The participant was first reached (for the baseline home interview).' ), ",
      "( 'completed (Baseline Home)', 'Interview completed (for the baseline home interview).' ), ",
      "( 'first attempt (Baseline Site)', 'First attempt to contact (for the baseline site interview).' ), ",
      "( 'reached (Baseline Site)', 'The participant was first reached (for the baseline site interview).' ), ",
      "( 'completed (Baseline Site)', 'Interview completed (for the baseline site interview).' )" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- fill in "completed pilot interview" event from old participant table -------------------------
    SELECT "Filling in 'completed pilot interview' event from old participant table" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".event( participant_id, event_type_id, datetime ) ",
      "SELECT mp.id, event_type.id, mp.prior_contact_date ",
      "FROM ", @mastodon, ".participant mp, ", @cenozo, ".event_type ",
      "WHERE event_type.name = 'completed pilot interview' ",
      "AND mp.prior_contact_date IS NOT NULL" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- event --------------------------------------------------------------------------------------
    SELECT "Processing event" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".event ( update_timestamp, create_timestamp, participant_id, ",
                                        "event_type_id, datetime ) ",
      "SELECT mstatus.update_timestamp, mstatus.create_timestamp, mstatus.participant_id, ",
             "event_type.id, mstatus.datetime ",
      "FROM ", @mastodon, ".status mstatus ",
      "JOIN ", @cenozo, ".event_type ON mstatus.event = event_type.name" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".event ( participant_id, event_type_id, datetime ) ",
      "SELECT participant.id, event_type.id, phone_call.start_datetime ",
      "FROM ", @cenozo, ".event_type, ", @sabretooth, ".interview ",
      "JOIN ", @sabretooth, ".qnaire ON interview.qnaire_id = qnaire.id ",
      "JOIN ", @sabretooth, ".participant sparticipant ON interview.participant_id = sparticipant.id ",
      "JOIN ", @cenozo, ".participant ON sparticipant.uid = participant.uid ",
      "JOIN ", @sabretooth, ".assignment ON interview.id = assignment.interview_id ",
      "JOIN ", @sabretooth, ".phone_call ON assignment.id = phone_call.assignment_id ",
      "AND phone_call.start_datetime = ( ",
        "SELECT MIN( phone_call_2.start_datetime ) ",
        "FROM ", @sabretooth, ".phone_call phone_call_2 ",
        "JOIN ", @sabretooth, ".assignment assignment_2 ON assignment_2.id = phone_call_2.assignment_id ",
        "JOIN ", @sabretooth, ".interview interview_2 ON interview_2.id = assignment_2.interview_id ",
        "WHERE interview.id = interview_2.id ",
        "GROUP BY interview_2.id ) ",
      "WHERE event_type.name = CONCAT( 'first attempt (', qnaire.name, ')' )" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".event ( participant_id, event_type_id, datetime ) ",
      "SELECT participant.id, event_type.id, phone_call.start_datetime ",
      "FROM ", @cenozo, ".event_type, ", @beartooth, ".interview ",
      "JOIN ", @beartooth, ".qnaire ON interview.qnaire_id = qnaire.id ",
      "JOIN ", @beartooth, ".participant sparticipant ON interview.participant_id = sparticipant.id ",
      "JOIN ", @cenozo, ".participant ON sparticipant.uid = participant.uid ",
      "JOIN ", @beartooth, ".assignment ON interview.id = assignment.interview_id ",
      "JOIN ", @beartooth, ".phone_call ON assignment.id = phone_call.assignment_id ",
      "AND phone_call.start_datetime = ( ",
        "SELECT MIN( phone_call_2.start_datetime ) ",
        "FROM ", @beartooth, ".phone_call phone_call_2 ",
        "JOIN ", @beartooth, ".assignment assignment_2 ON assignment_2.id = phone_call_2.assignment_id ",
        "JOIN ", @beartooth, ".interview interview_2 ON interview_2.id = assignment_2.interview_id ",
        "WHERE interview.id = interview_2.id ",
        "GROUP BY interview_2.id ) ",
      "WHERE event_type.name = CONCAT( 'first attempt (', qnaire.name, ')' )" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".event ( participant_id, event_type_id, datetime ) ",
      "SELECT participant.id, event_type.id, phone_call.start_datetime ",
      "FROM ", @cenozo, ".event_type, ", @sabretooth, ".interview ",
      "JOIN ", @sabretooth, ".qnaire ON interview.qnaire_id = qnaire.id ",
      "JOIN ", @sabretooth, ".participant sparticipant ON interview.participant_id = sparticipant.id ",
      "JOIN ", @cenozo, ".participant ON sparticipant.uid = participant.uid ",
      "JOIN ", @sabretooth, ".assignment ON interview.id = assignment.interview_id ",
      "JOIN ", @sabretooth, ".phone_call ON assignment.id = phone_call.assignment_id ",
      "AND phone_call.start_datetime = ( ",
        "SELECT MIN( phone_call_2.start_datetime ) ",
        "FROM ", @sabretooth, ".phone_call phone_call_2 ",
        "JOIN ", @sabretooth, ".assignment assignment_2 ON assignment_2.id = phone_call_2.assignment_id ",
        "JOIN ", @sabretooth, ".interview interview_2 ON interview_2.id = assignment_2.interview_id ",
        "WHERE phone_call_2.status = 'contacted' ",
        "AND interview.id = interview_2.id ",
        "GROUP BY interview_2.id ) ",
      "WHERE event_type.name = CONCAT( 'reached (', qnaire.name, ')' )" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".event ( participant_id, event_type_id, datetime ) ",
      "SELECT participant.id, event_type.id, phone_call.start_datetime ",
      "FROM ", @cenozo, ".event_type, ", @beartooth, ".interview ",
      "JOIN ", @beartooth, ".qnaire ON interview.qnaire_id = qnaire.id ",
      "JOIN ", @beartooth, ".participant sparticipant ON interview.participant_id = sparticipant.id ",
      "JOIN ", @cenozo, ".participant ON sparticipant.uid = participant.uid ",
      "JOIN ", @beartooth, ".assignment ON interview.id = assignment.interview_id ",
      "JOIN ", @beartooth, ".phone_call ON assignment.id = phone_call.assignment_id ",
      "AND phone_call.start_datetime = ( ",
        "SELECT MIN( phone_call_2.start_datetime ) ",
        "FROM ", @beartooth, ".phone_call phone_call_2 ",
        "JOIN ", @beartooth, ".assignment assignment_2 ON assignment_2.id = phone_call_2.assignment_id ",
        "JOIN ", @beartooth, ".interview interview_2 ON interview_2.id = assignment_2.interview_id ",
        "WHERE phone_call_2.status = 'contacted' ",
        "AND interview.id = interview_2.id ",
        "GROUP BY interview_2.id ) ",
      "WHERE event_type.name = CONCAT( 'reached (', qnaire.name, ')' )" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".event ( participant_id, event_type_id, datetime ) ",
      "SELECT participant.id, event_type.id, assignment.end_datetime ",
      "FROM ", @cenozo, ".event_type, ", @sabretooth, ".interview ",
      "JOIN ", @sabretooth, ".qnaire ON interview.qnaire_id = qnaire.id ",
      "JOIN ", @sabretooth, ".participant sparticipant ON interview.participant_id = sparticipant.id ",
      "JOIN ", @cenozo, ".participant ON sparticipant.uid = participant.uid ",
      "JOIN ", @sabretooth, ".interview_last_assignment ",
      "ON interview.id = interview_last_assignment.interview_id ",
      "JOIN ", @sabretooth, ".assignment ",
      "ON interview_last_assignment.assignment_id = assignment.id ",
      "WHERE event_type.name = CONCAT( 'completed (', qnaire.name, ')' ) ",
      "AND interview.completed = true" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".event ( participant_id, event_type_id, datetime ) ",
      "SELECT participant.id, event_type.id, ",
             "IFNULL( assignment.end_datetime, interview.update_timestamp + INTERVAL 5 HOUR ) ",
      "FROM ", @cenozo, ".event_type, ", @beartooth, ".interview ",
      "JOIN ", @beartooth, ".qnaire ON interview.qnaire_id = qnaire.id ",
      "JOIN ", @beartooth, ".participant bparticipant ON interview.participant_id = bparticipant.id ",
      "JOIN ", @cenozo, ".participant ON bparticipant.uid = participant.uid ",
      "LEFT JOIN ", @beartooth, ".interview_last_assignment ",
      "ON interview.id = interview_last_assignment.interview_id ",
      "LEFT JOIN ", @beartooth, ".assignment ",
      "ON interview_last_assignment.assignment_id = assignment.id ",
      "WHERE event_type.name = CONCAT( 'completed (', qnaire.name, ')' ) ",
      "AND interview.completed = true" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- alternate -----------------------------------------------------------------------------------
    SELECT "Processing alternate" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".alternate SELECT * FROM ", @mastodon, ".alternate" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- availability --------------------------------------------------------------------------------
    SELECT "Processing availability" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".availability SELECT * FROM ", @mastodon, ".availability" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- consent -------------------------------------------------------------------------------------
    SELECT "Processing consent" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".consent( id, update_timestamp, create_timestamp, participant_id ,",
                                         "accept, written, date, note ) ",
      "SELECT mc.id, mc.update_timestamp, mc.create_timestamp, mc.participant_id, ",
             "mc.event IN ( 'verbal accept', 'written accept' ), ",
             "mc.event IN ( 'written accept', 'written deny' ), mc.date, mc.note ",
      "FROM ", @mastodon, ".consent mc" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- jurisdiction --------------------------------------------------------------------------------
    SELECT "Processing jurisdiction" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".jurisdiction SELECT * FROM ", @mastodon, ".jurisdiction" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- phone ---------------------------------------------------------------------------------------
    SELECT "Processing phone" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".phone SELECT * FROM ", @mastodon, ".phone" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- quota ---------------------------------------------------------------------------------------
    SELECT "Processing quota" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".quota ",
      "SELECT mquota.* ",
      "FROM ", @mastodon, ".quota mquota " );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- adding new MC quotas ------------------------------------------------------------------------
    SELECT "Adding new MC quotas" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".quota ",
      "SELECT ",
      "FROM ", @mastodon, ".quota mquota "
      "" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- person_note ---------------------------------------------------------------------------------
    SELECT "Processing person_note" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".person_note SELECT * FROM ", @mastodon, ".person_note" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- service_has_cohort --------------------------------------------------------------------------
    SELECT "Processing service_has_cohort" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".service_has_cohort ",
      "SET service_id = ( SELECT id FROM service WHERE title = 'Beartooth' ), ",
      "cohort_id = ( SELECT id FROM cohort WHERE name = 'comprehensive' ), ",
      "grouping = 'jurisdiction'" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".service_has_cohort ",
      "SET service_id = ( SELECT id FROM service WHERE title = 'Sabretooth' ), ",
      "cohort_id = ( SELECT id FROM cohort WHERE name = 'tracking' ), ",
      "grouping = 'region'" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- service_has_participant ---------------------------------------------------------------------
    SELECT "Processing service_has_participant" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".service_has_participant( service_id, participant_id, preferred_site_id, datetime ) ",
      "SELECT service.id, mparticipant.id, mparticipant.site_id, mparticipant.sync_datetime ",
      "FROM ", @mastodon, ".participant mparticipant ",
      "JOIN ", @cenozo, ".cohort ON mparticipant.cohort = cohort.name ",
      "JOIN ", @cenozo, ".service_has_cohort ON cohort.id = service_has_cohort.cohort_id ",
      "JOIN ", @cenozo, ".service ON service_has_cohort.service_id = service.id ",
      "WHERE site_id IS NOT NULL OR sync_datetime IS NOT NULL" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- unique_identifier_pool ----------------------------------------------------------------------
    SELECT "Processing unique_identifier_pool" AS "";
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".unique_identifier_pool SELECT * FROM ", @mastodon, ".unique_identifier_pool" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL convert_database();
DROP PROCEDURE IF EXISTS convert_database;

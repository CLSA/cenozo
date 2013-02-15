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
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".user( id, update_timestamp, create_timestamp, name, ",
                               "first_name, last_name, active, theme, language ) ",
      "SELECT muser.*, IFNULL( buser.language, 'en' ) ",
      "FROM ", @mastodon, ".user muser ",
      "LEFT JOIN ", @beartooth, ".user buser ON muser.name = buser.name" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- role ----------------------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".role SELECT * FROM ", @mastodon, ".role" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- cohort --------------------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".cohort ( name ) VALUES ",
      "( 'comprehensive' ), ",
      "( 'tracking' )" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- service -------------------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".service( name, version ) VALUES ",
      "( 'Mastodon', '1.2.0' ), ",
      "( 'Beartooth', '1.1.0' ), ",
      "( 'Sabretooth', '1.2.0' )" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- service_has_role ----------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".service_has_role( service_id, role_id ) ",
      "SELECT service.id, role.id ",
      "FROM ", @cenozo, ".service, ", @cenozo, ".role ",
      "WHERE service.name = 'Mastodon' ",
      "AND role.name IN ( 'administrator', 'typist' ) UNION ",
      "SELECT service.id, role.id ",
      "FROM ", @cenozo, ".service, ", @cenozo, ".role ",
      "WHERE service.name = 'Beartooth' ",
      "AND role.name IN ( 'administrator', 'operator', 'supervisor', 'opal' ) UNION ",
      "SELECT service.id, role.id ",
      "FROM ", @cenozo, ".service, ", @cenozo, ".role ",
      "WHERE service.name = 'Sabretooth' ",
      "AND role.name IN ( 'administrator', 'coordinator', 'interviewer', 'onyx' ) " );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- site ----------------------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".site( id, update_timestamp, create_timestamp, name, timezone, service_id ) ",
      "SELECT id, update_timestamp, create_timestamp, name, timezone, IF( cohort = 'tracking', 3, 2 ) ",
      "FROM ", @mastodon, ".site" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- region --------------------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".region SELECT * FROM ", @mastodon, ".region" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- finish populating site ----------------------------------------------------------------------
    SET @sql = CONCAT(
      "UPDATE ", @cenozo, ".site, ", @beartooth, ".site bsite, ", @beartooth, ".region bregion, ", @cenozo, ".region ",
      "SET site.title = bsite.institution, ",
      "site.phone_number = bsite.phone_number, ",
      "site.address1 = bsite.address1, ",
      "site.address2 = bsite.address2, ",
      "site.city = bsite.city, ",
      "site.region_id = region.id, ",
      "site.postcode = bsite.postcode ",
      "WHERE site.service_id = ( SELECT id FROM ", @cenozo, ".service WHERE name = 'Beartooth' ) ",
      "AND site.name = bsite.name ",
      "AND bsite.region_id = bregion.id ",
      "AND bregion.name = region.name" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- access --------------------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".access SELECT * FROM ", @mastodon, ".access" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- system_message ------------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".system_message( update_timestamp, create_timestamp, service_id, ",
                                         "site_id, role_id, title, note ) ",
      "SELECT msystem_message.update_timestamp, msystem_message.create_timestamp, this_service.id, ",
             "msystem_message.site_id, msystem_message.role_id, msystem_message.title, msystem_message.note ",
      "FROM ", @cenozo, ".service this_service, ", @mastodon, ".system_message msystem_message ",
      "WHERE this_service.name = 'Mastodon'" );
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
      "WHERE this_service.name = 'Sabretooth'" );
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
      "WHERE this_service.name = 'Beartooth'" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- postcode ------------------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".postcode SELECT * FROM ", @mastodon, ".postcode" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- person --------------------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".person SELECT * FROM ", @mastodon, ".person" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- address -------------------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".address SELECT * FROM ", @mastodon, ".address" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- age_group -----------------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".age_group SELECT * FROM ", @mastodon, ".age_group" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- source --------------------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".source SELECT * FROM ", @mastodon, ".source" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- participant ---------------------------------------------------------------------------------
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

    -- event ---------------------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".event( name ) VALUES ",
      "( 'completed pilot interview' ), ",
      "( 'imported by rdd' ), ",
      "( 'consent to contact received' ), ",
      "( 'consent for proxy received' ), ",
      "( 'package mailed' )" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- fill in "complted pilot interview" event from old participant table -------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".participant_event( participant_id, event_id, datetime ) ",
      "SELECT mp.id, event.id, mp.prior_contact_date ",
      "FROM ", @mastodon, ".participant mp, ", @cenozo, ".event ",
      "WHERE event.name = 'completed pilot interview' ",
      "AND mp.prior_contact_date IS NOT NULL" )
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- participant_event ---------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".participant_event ( update_timestamp, create_timestamp, participant_id, ",
                                             "event_id, datetime ) ",
      "SELECT mstatus.update_timestamp, mstatus.create_timestamp, mstatus.participant_id, ",
             "event.id, mstatus.datetime ",
      "FROM ", @mastodon, ".status mstatus ",
      "JOIN ", @cenozo, ".event ON mstatus.event = event.name" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- alternate -----------------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".alternate SELECT * FROM ", @mastodon, ".alternate" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- availability --------------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".availability SELECT * FROM ", @mastodon, ".availability" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- consent -------------------------------------------------------------------------------------
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
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".jurisdiction SELECT * FROM ", @mastodon, ".jurisdiction" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- phone ---------------------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".phone SELECT * FROM ", @mastodon, ".phone" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- quota ---------------------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".quota ",
      "SELECT mquota.*, squota.disabled ",
      "FROM ", @mastodon, ".quota mquota ",
      "JOIN ", @mastodon, ".region mregion ON mquota.region_id = mregion.id ",
      "JOIN ", @sabretooth, ".region sregion ON mregion.name = sregion.name ",
      "JOIN ", @mastodon, ".site msite ON mquota.site_id = msite.id ",
      "JOIN ", @sabretooth, ".site ssite ON msite.name = ssite.name AND msite.cohort = 'tracking' ",
      "JOIN ", @mastodon, ".age_group mage_group ON mquota.age_group_id = mage_group.id ",
      "JOIN ", @sabretooth, ".age_group sage_group ON mage_group.lower = sage_group.lower ",
      "LEFT JOIN ", @sabretooth, ".quota squota ",
      "ON squota.region_id = sregion.id ",
      "AND squota.site_id = ssite.id ",
      "AND squota.gender = mquota.gender ",
      "AND squota.age_group_id = sage_group.id" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".quota ",
      "SELECT mquota.*, 0 ",
      "FROM ", @mastodon, ".quota mquota ",
      "JOIN ", @mastodon, ".region mregion ON mquota.region_id = mregion.id ",
      "JOIN ", @beartooth, ".region bregion ON mregion.name = bregion.name ",
      "JOIN ", @mastodon, ".site msite ON mquota.site_id = msite.id ",
      "JOIN ", @beartooth, ".site bsite ON msite.name = bsite.name AND msite.cohort = 'comprehensive' ",
      "JOIN ", @mastodon, ".age_group mage_group ON mquota.age_group_id = mage_group.id ",
      "JOIN ", @beartooth, ".age_group bage_group ON mage_group.lower = bage_group.lower " );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- person_note ---------------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".person_note SELECT * FROM ", @mastodon, ".person_note" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- service_has_cohort --------------------------------------------------------------------------
    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".service_has_cohort ",
      "SET service_id = ( SELECT id FROM service WHERE name = 'Beartooth' ), ",
      "cohort_id = ( SELECT id FROM cohort WHERE name = 'comprehensive' ), ",
      "grouping = 'jurisdiction'" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    SET @sql = CONCAT(
      "INSERT INTO ", @cenozo, ".service_has_cohort ",
      "SET service_id = ( SELECT id FROM service WHERE name = 'Sabretooth' ), ",
      "cohort_id = ( SELECT id FROM cohort WHERE name = 'tracking' ), ",
      "grouping = 'region'" );
    PREPARE statement FROM @sql;
    EXECUTE statement; 
    DEALLOCATE PREPARE statement;

    -- service_has_participant ---------------------------------------------------------------------
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

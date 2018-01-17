DROP PROCEDURE IF EXISTS patch_rename_states;
DELIMITER //
CREATE PROCEDURE patch_rename_states()
  BEGIN

    SET @test = ( 
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "state" );
    IF @test = 1 THEN

      SELECT "Renaming some states in preperation for the new hold module" AS "";

      DELETE FROM export_restriction
      WHERE table_name = "participant"
      AND column_name = "state_id"
      AND value = ( SELECT id FROM state WHERE name = "FU1 Institutionalized" );

      UPDATE export_restriction
      SET value = ( SELECT id FROM state WHERE name = "Participant Requires Proxy" )
      WHERE table_name = "participant"
      AND column_name = "state_id"
      AND value IN ( SELECT id FROM state WHERE name IN( "institutionalized", "FU1 Institutionalized" ) );

      UPDATE state AS new_state, participant
      JOIN state ON participant.state_id = state.id
      SET participant.state_id = new_state.id
      WHERE new_state.name = "Participant Requires Proxy"
      AND state.name IN( "institutionalized", "FU1 Institutionalized" );

      DELETE FROM state WHERE name = "FU1 Institutionalized";

      UPDATE state SET name = "requires initiation" WHERE name = "Participant Requires Proxy";
      UPDATE state SET name = "requires form" WHERE name = "FU1 Mail Proxy Materials";
      UPDATE state SET name = "ready" WHERE name = "FU1 Proxy DM chosen";
      UPDATE state SET name = "ready, information provider only" WHERE name = "FU1 Proxy IP only chosen";
      UPDATE state SET name = "local" WHERE name = "Sourcing Required";
      UPDATE state SET name = "global" WHERE name = "NCC Sourcing Required";

      UPDATE state SET name = "Deaf" WHERE name = "deaf";
      UPDATE state SET name = "Deceased" WHERE name = "deceased";
      UPDATE state SET name = "Duplicate" WHERE name = "duplicate";
      UPDATE state SET name = "Noncompliant" WHERE name = "noncompliant";
      UPDATE state SET name = "Other" WHERE name = "other";
      UPDATE state SET name = "Age Range" WHERE name = "age range";
      UPDATE state SET name = "Armed Forces" WHERE name = "armed forces";
      UPDATE state SET name = "Consent Unavailable" WHERE name = "consent unavailable";
      UPDATE state SET name = "Federal Reserve" WHERE name = "federal reserve";
      UPDATE state SET name = "Language Barrier" WHERE name = "language barrier";
      UPDATE state SET name = "Not Canadian" WHERE name = "not canadian";
      UPDATE state SET name = "Not Interested" WHERE name = "not interested";
      UPDATE state SET name = "Not Low Education" WHERE name = "not low education";
      UPDATE state SET name = "Enrollment Closed" WHERE name = "enrollment closed";

    END IF;

  END //
DELIMITER ;

CALL patch_rename_states();
DROP PROCEDURE IF EXISTS patch_rename_states;

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

      UPDATE state AS new_state, participant
      JOIN state ON participant.state_id = state.id
      SET participant.state_id = new_state.id
      WHERE new_state.name = "institutionalized"
      AND state.name = "FU1 Institutionalized";

      DELETE FROM state WHERE name = "FU1 Institutionalized";

      UPDATE state SET name = "requires initiation" WHERE name = "institutionalized";
      UPDATE state SET name = "requires form" WHERE name = "FU1 Mail Proxy Materials";
      UPDATE state SET name = "ready" WHERE name = "FU1 Proxy DM chosen";
      UPDATE state SET name = "ready, information provider only" WHERE name = "FU1 Proxy IP only chosen";
      UPDATE state SET name = "local" WHERE name = "Sourcing Required";
      UPDATE state SET name = "global" WHERE name = "NCC Sourcing Required";

    END IF;

  END //
DELIMITER ;

CALL patch_rename_states();
DROP PROCEDURE IF EXISTS patch_rename_states;

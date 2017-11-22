DROP PROCEDURE IF EXISTS remove_duplicate_holds;
DELIMITER //
CREATE PROCEDURE remove_duplicate_holds()
  BEGIN
    SET @test = ( SELECT cenozo FROM application LIMIT 1 );
    IF @test != "2.2" THEN
      SELECT "Removing duplicate holds" AS "";
      CALL _remove_duplicate_holds();
    END IF;
  END //
DELIMITER ;


DROP PROCEDURE IF EXISTS _remove_duplicate_holds;
DELIMITER //
CREATE PROCEDURE _remove_duplicate_holds()
  BEGIN

    -- Declare '_val' variables to read in each record from the cursor
    DECLARE id_val INT UNSIGNED;
    DECLARE participant_id_val INT UNSIGNED;
    DECLARE hold_type_id_val INT UNSIGNED;
    DECLARE last_participant_id_val INT UNSIGNED;
    DECLARE last_hold_type_id_val INT UNSIGNED;

    -- Declare variables used just for cursor and loop control
    DECLARE no_more_rows BOOLEAN;
    DECLARE loop_cntr INT DEFAULT 0;
    DECLARE num_rows INT DEFAULT 0;

    -- Declare the cursor
    DECLARE the_cursor CURSOR FOR
    SELECT id, participant_id, hold_type_id FROM hold ORDER BY participant_id, datetime;

    -- Declare 'handlers' for exceptions
    DECLARE CONTINUE HANDLER FOR NOT FOUND
    SET no_more_rows = TRUE;

    -- 'open' the cursor and capture the number of rows returned
    -- (the 'select' gets invoked when the cursor is 'opened')
    OPEN the_cursor;
    select FOUND_ROWS() into num_rows;

    SET last_participant_id_val = NULL;
    SET last_hold_type_id_val = NULL;

    the_loop: LOOP

      FETCH the_cursor
      INTO id_val, participant_id_val, hold_type_id_val;

      -- break out of the loop if
        -- 1) there were no records, or
        -- 2) we've processed them all
      IF no_more_rows THEN
        CLOSE the_cursor;
        LEAVE the_loop;
      END IF;

      IF participant_id_val = last_participant_id_val AND hold_type_id_val <=> last_hold_type_id_val THEN
        DELETE FROM hold WHERE id = id_val;
      ELSE
        SET last_participant_id_val = participant_id_val;
        SET last_hold_type_id_val = hold_type_id_val;
      END IF;

      -- count the number of times looped
      SET loop_cntr = loop_cntr + 1;

    END LOOP the_loop;

  END //
DELIMITER ;

CALL remove_duplicate_holds();
DROP PROCEDURE IF EXISTS remove_duplicate_holds;
DROP PROCEDURE IF EXISTS _remove_duplicate_holds;

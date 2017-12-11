DROP PROCEDURE IF EXISTS remove_duplicate_proxy_now;
DELIMITER //
CREATE PROCEDURE remove_duplicate_proxy_now()
  BEGIN
    SET @test = ( SELECT cenozo FROM application LIMIT 1 );
    IF @test != "2.2" THEN
      SELECT "Removing duplicate proxys" AS "";
      CALL remove_duplicate_proxy( NULL );
    END IF;
  END //
DELIMITER ;


SELECT "Creating new remove_duplicate_proxy procedure" AS "";

DROP PROCEDURE IF EXISTS remove_duplicate_proxy;
DELIMITER //
CREATE PROCEDURE remove_duplicate_proxy(IN proc_participant_id INT(10) UNSIGNED)
BEGIN
  -- Declare '_val' variables to read in each record from the cursor
  DECLARE id_val INT UNSIGNED;
  DECLARE participant_id_val INT UNSIGNED;
  DECLARE proxy_type_id_val INT UNSIGNED;
  DECLARE last_participant_id_val INT UNSIGNED;
  DECLARE last_proxy_type_id_val INT UNSIGNED;

  -- Declare variables used just for cursor and loop control
  DECLARE no_more_rows BOOLEAN;
  DECLARE loop_cntr INT DEFAULT 0;
  DECLARE num_rows INT DEFAULT 0;

  -- Declare the cursor
  DECLARE the_cursor CURSOR FOR
  SELECT id, participant_id, proxy_type_id
  FROM proxy
  WHERE participant_id = IFNULL( proc_participant_id, participant_id )
  ORDER BY participant_id, datetime;

  -- Declare 'handlers' for exceptions
  DECLARE CONTINUE HANDLER FOR NOT FOUND
  SET no_more_rows = TRUE;

  -- 'open' the cursor and capture the number of rows returned
  -- (the 'select' gets invoked when the cursor is 'opened')
  OPEN the_cursor;
  select FOUND_ROWS() into num_rows;

  SET last_participant_id_val = NULL;
  SET last_proxy_type_id_val = NULL;

  the_loop: LOOP

    FETCH the_cursor
    INTO id_val, participant_id_val, proxy_type_id_val;

    -- break out of the loop if
      -- 1) there were no records, or
      -- 2) we've processed them all
    IF no_more_rows THEN
      CLOSE the_cursor;
      LEAVE the_loop;
    END IF;

    IF NOT (participant_id_val <=> last_participant_id_val ) THEN
      -- new participant's proxy

      IF proxy_type_id_val IS NULL THEN
        -- always remove the first proxy if the proxy-type is null
        DELETE FROM proxy WHERE id = id_val;
        SET last_participant_id_val = NULL;
        SET last_proxy_type_id_val = NULL;
      ELSE
        -- not deleting the proxy, so mark it as the last
        SET last_participant_id_val = participant_id_val;
        SET last_proxy_type_id_val = proxy_type_id_val;
      END IF;
    ELSE
      -- same participant as last time

      -- check to make sure this proxy isn't a duplicate of the last
      IF proxy_type_id_val <=> last_proxy_type_id_val THEN
        -- delete the duplicate proxy
        DELETE FROM proxy WHERE id = id_val;
      ELSE
        -- not deleting the proxy, so mark it as the last
        SET last_participant_id_val = participant_id_val;
        SET last_proxy_type_id_val = proxy_type_id_val;
      END IF;
    END IF;

    -- count the number of times looped
    SET loop_cntr = loop_cntr + 1;

  END LOOP the_loop;

END //
DELIMITER ;

CALL remove_duplicate_proxy_now();
DROP PROCEDURE IF EXISTS remove_duplicate_proxy_now;

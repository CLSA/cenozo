CREATE DEFINER=patrick@localhost PROCEDURE remove_duplicate_hold(IN proc_participant_id INT(10) UNSIGNED)
BEGIN

  DECLARE id_val INT UNSIGNED;
  DECLARE participant_id_val INT UNSIGNED;
  DECLARE hold_type_id_val INT UNSIGNED;
  DECLARE last_participant_id_val INT UNSIGNED;
  DECLARE last_hold_type_id_val INT UNSIGNED;

  DECLARE no_more_rows BOOLEAN;
  DECLARE loop_cntr INT DEFAULT 0;
  DECLARE num_rows INT DEFAULT 0;

  DECLARE the_cursor CURSOR FOR
  SELECT id, participant_id, hold_type_id
  FROM hold
  WHERE participant_id = IFNULL( proc_participant_id, participant_id )
  ORDER BY participant_id, datetime;

  DECLARE CONTINUE HANDLER FOR NOT FOUND
  SET no_more_rows = TRUE;

  OPEN the_cursor;
  select FOUND_ROWS() into num_rows;

  SET last_participant_id_val = NULL;
  SET last_hold_type_id_val = NULL;

  the_loop: LOOP

    FETCH the_cursor
    INTO id_val, participant_id_val, hold_type_id_val;

    IF no_more_rows THEN
      CLOSE the_cursor;
      LEAVE the_loop;
    END IF;

    IF NOT (participant_id_val <=> last_participant_id_val ) THEN

      IF hold_type_id_val IS NULL THEN

        DELETE FROM hold WHERE id = id_val;
        SET last_participant_id_val = NULL;
        SET last_hold_type_id_val = NULL;
      ELSE

        SET last_participant_id_val = participant_id_val;
        SET last_hold_type_id_val = hold_type_id_val;
      END IF;
    ELSE

      IF hold_type_id_val <=> last_hold_type_id_val THEN

        DELETE FROM hold WHERE id = id_val;
      ELSE

        SET last_participant_id_val = participant_id_val;
        SET last_hold_type_id_val = hold_type_id_val;
      END IF;
    END IF;

    SET loop_cntr = loop_cntr + 1;

  END LOOP the_loop;

END ;;
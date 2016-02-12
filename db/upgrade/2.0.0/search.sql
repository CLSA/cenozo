SELECT "Creating new search table" AS "";

DROP TABLE IF EXISTS search;
CREATE TABLE IF NOT EXISTS search (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  query VARCHAR(255) NOT NULL,
  datetime DATETIME NOT NULL,
  subject VARCHAR(64) NOT NULL,
  column_name VARCHAR(64) NOT NULL,
  record_id INT UNSIGNED NOT NULL,
  value VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_query_subject_record_id (query ASC, subject ASC, record_id ASC),
  INDEX dk_datetime (datetime ASC),
  INDEX dk_query (query ASC))
ENGINE = InnoDB;


SELECT "Creating new search procedure" AS "";

DROP procedure IF EXISTS search;

DELIMITER $$
CREATE PROCEDURE search( IN q VARCHAR(512) )
BEGIN

  -- Delete all search terms more than 10 minutes old
  DELETE FROM search WHERE datetime + INTERVAL 10 MINUTE < UTC_TIMESTAMP();
  
  -- Only write new search records if they don't already exist
  SET @test = ( SELECT COUNT(*) FROM search WHERE query = q );
  IF @test = 0 THEN
    CALL run_search( q );
  END IF;

END$$

DELIMITER ;


SELECT "Creating new run_search procedure" AS "";

DROP procedure IF EXISTS run_search;

DELIMITER $$
CREATE PROCEDURE run_search( IN q VARCHAR(512) )
BEGIN

  -- Declare '_val' variables to read in each record from the cursor
  DECLARE database_val VARCHAR(64);
  DECLARE table_val VARCHAR(64);
  DECLARE column_val VARCHAR(64);

  -- Declare variables used just for cursor and loop control
  DECLARE no_more_rows BOOLEAN;
  DECLARE loop_cntr INT DEFAULT 0;
  DECLARE num_rows INT DEFAULT 0;

  -- Declare the cursor
  DECLARE the_cursor CURSOR FOR 
  SELECT table_schema, table_name, column_name
  FROM information_schema.columns
  WHERE table_schema IN( DATABASE(), (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema = DATABASE()
      AND constraint_name = "fk_access_site_id"
    ) )
    AND data_type IN ( 'text', 'varchar' )
    AND table_name NOT IN (
      'service',
      'unique_identifier_pool',
      'user_has_application',
      'variable_cache',
      'writelog' )
   ORDER BY table_name, column_name;

  -- Declare 'handlers' for exceptions
  DECLARE CONTINUE HANDLER FOR NOT FOUND
  SET no_more_rows = TRUE;

  -- 'open' the cursor and capture the number of rows returned
  -- (the 'select' gets invoked when the cursor is 'opened')
  OPEN the_cursor;
  select FOUND_ROWS() into num_rows;

  the_loop: LOOP

    FETCH the_cursor INTO database_val, table_val, column_val;

    -- break out of the loop if
      -- 1) there were no records, or
      -- 2) we've processed them all
    IF no_more_rows THEN
        CLOSE the_cursor;
        LEAVE the_loop;
    END IF;
    SET @sql = CONCAT(
      "REPLACE INTO search( query, datetime, subject, column_name, record_id, value )",
      "SELECT '", q,"', UTC_TIMESTAMP(), ",
             "'", table_val, "', '", column_val, "', id, ",
                        "IF( CHAR_LENGTH( ", column_val, " ) > 100, ",
                 "CONCAT( SUBSTRING( ", column_val, ", 1, 252 ), '...' ), ",
                 column_val, " ) ",
      "FROM ", database_val, ".", table_val, " "
      "WHERE ", column_val, " LIKE '", q, "'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    -- count the number of times looped
    SET loop_cntr = loop_cntr + 1;

  END LOOP the_loop;

END$$

DELIMITER ;

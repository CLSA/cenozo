<?php
/**
 * database.class.php
 * For now see {@link connect} for the current hack/solution.
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * The database class represents a database connection and information.
 */
class database extends \cenozo\base_object
{
  /**
   * Constructor
   * 
   * The constructor either creates a new connection to a database.
   * @param string $server The name of the database's server
   * @param string $username The username to connect with.
   * @param string $password The password to connect with.
   * @param string $database The name of the database.
   * @throws exception\runtime
   * @access public
   */
  public function __construct( $server, $username, $password, $database )
  {
    $this->server = $server;
    $this->username = $username;
    $this->password = $password;
    $this->name = $database;

    // set up the database connection
    $this->connection = new \mysqli( $this->server, $this->username, $this->password, $this->name );
    $this->connection->set_charset( 'utf8mb4' );
    if( lib::in_development_mode() ) $this->execute( 'SET profiling = 1', false );

    // used to make sure group_concat results goes beyond 1024 chars
    $this->execute( 'SET group_concat_max_len = 65536', false );

    $this->read_schema();
  }

  /**
   * Reads the database schema into memory
   * 
   * @access protected
   */
  protected function read_schema()
  {
    $filename = sprintf( '%s/%s.schema.ser', TEMPORARY_FILES_PATH, $this->name );

    if( file_exists( $filename ) && 0 < filesize( $filename ) )
    {
      $this->tables = unserialize( file_get_contents( $filename ) );
    }
    else // read direclty from the database and write the results to a cached file when done
    {
      $setting_manager = lib::create( 'business\setting_manager' );

      // determine the database version number and whether defaults are defined in quotes
      $database_version = $this->get_one( 'SELECT VERSION()' );
      $quoted_defaults = false;
      if( 1 == preg_match( '/^10\.([0-9]+)\./', $database_version, $matches ) )
        $quoted_defaults = 2 < intval( $matches[1] );

      // determine the framework name
      $framework_name = sprintf(
        '%s%s',
        $setting_manager->get_setting( 'db', 'database_prefix' ),
        $setting_manager->get_setting( 'general', 'framework_name' ) );
      $schema_list = array( '"'.$this->name.'"', '"'.$framework_name.'"' );

      $column_mod = lib::create( 'database\modifier' );
      $column_mod->where( 'table_schema', 'IN', $schema_list, false );
      $column_mod->where( 'column_type', '!=', '"mediumblob"', false );
      $column_mod->where( 'column_type', '!=', '"longblob"', false );
      $column_mod->order( 'table_name' );
      $column_mod->order( 'column_name' );

      $rows = $this->get_all(
        sprintf( 'SELECT table_schema, table_name, column_name, column_type, data_type, '."\n".
                 'character_maximum_length, column_key, column_default, '."\n".
                 'is_nullable != "YES" AS is_nullable '."\n".
                 'FROM information_schema.columns %s ',
                 $column_mod->get_sql() ),
        false ); // do not add table names

      // record the tables, columns and types
      foreach( $rows as $row )
      {
        extract( $row ); // defines variables based on column values in query

        // convert the column default if defaults are quoted
        if( $quoted_defaults )
          $column_default = is_null( $column_default ) || 'NULL' == $column_default
                          ? NULL
                          : preg_replace( "/^'(.*)'$/", '$1', $column_default );

        if( !array_key_exists( $table_name, $this->tables ) )
          $this->tables[$table_name] =
            array( 'database' => $table_schema,
                   'primary' => array(),
                   'constraints' => array(),
                   'columns' => array() );

        if( 'PRI' == strtoupper( $column_key ) )
          $this->tables[$table_name]['primary'][] = $column_name;

        $this->tables[$table_name]['columns'][$column_name] =
          array( 'data_type' => $data_type,
                 'type' => $column_type,
                 'json' => false,
                 'default' => $column_default,
                 'max_length' => $character_maximum_length,
                 'required' => $is_nullable,
                 'key' => $column_key );
      }

      if( $this->get_one(
        'SELECT COUNT(*) '.
        'FROM information_schema.tables '.
        'WHERE table_schema = "information_schema" '.
        'AND table_name = "check_constraints"' ) )
      {
        $check_mod = lib::create( 'database\modifier' );
        $check_mod->where( 'constraint_schema', 'IN', $schema_list, false );

        $rows = $this->get_all(
          sprintf( 'SELECT table_name, constraint_name AS column_name '."\n".
                   'FROM information_schema.check_constraints %s',
                   $check_mod->get_sql() ),
          false ); // do not add table names

        // record the check constraints
        foreach( $rows as $row )
        {
          extract( $row ); // defines $table_name, $constraint_name and $column_name
          $this->tables[$table_name]['columns'][$column_name]['json'] = true;
        }
      }

      $constraint_mod = lib::create( 'database\modifier' );
      $constraint_mod->where( 'TABLE_CONSTRAINTS.TABLE_SCHEMA', 'IN', $schema_list, false );
      $constraint_mod->where( 'TABLE_CONSTRAINTS.CONSTRAINT_TYPE', '=', '"UNIQUE"', false );
      $constraint_mod->where( 'TABLE_CONSTRAINTS.CONSTRAINT_NAME', '=', 'KEY_COLUMN_USAGE.CONSTRAINT_NAME', false );
      $constraint_mod->group( 'table_name' );
      $constraint_mod->group( 'constraint_name' );
      $constraint_mod->group( 'column_name' );
      $constraint_mod->order( 'table_name' );
      $constraint_mod->order( 'constraint_name' );
      $constraint_mod->order( 'ordinal_position' );

      $rows = $this->get_all(
        sprintf( 'SELECT TABLE_CONSTRAINTS.TABLE_NAME table_name, '.
                        'TABLE_CONSTRAINTS.CONSTRAINT_NAME AS constraint_name, '.
                        'KEY_COLUMN_USAGE.COLUMN_NAME AS column_name '.
                 'FROM information_schema.TABLE_CONSTRAINTS, information_schema.KEY_COLUMN_USAGE %s',
                 $constraint_mod->get_sql() ),
        false ); // do not add table names

      // record the constraints
      foreach( $rows as $row )
      {
        extract( $row ); // defines $table_name, $constraint_name and $column_name
        $this->tables[$table_name]['constraints'][$constraint_name][] = $column_name;
      }

      // write cache of schema to disk
      $result = file_put_contents( $filename, serialize( $this->tables ) );
      if( false === $result )
      {
        log::warning(
          sprintf( 'Unable to write schema cache to "%s", make sure permissions are set correctly.',
                   $filename ) );
      }
    }
  }

  /**
   * Start a database transaction.
   * Transactions are automatically completed in the destructor.  To force-fail (rollback)
   * a transaction call fail_transaction()
   * 
   * @access public
   */
  public function start_transaction()
  {
    $setting_manager = lib::create( 'business\setting_manager' );

    // Only start a transaction for the main database
    // TODO: this was an ADOdb limitation, so we need to implement transactions for all databases (limesurvey)
    $database = sprintf(
      '%s%s', $setting_manager->get_setting( 'db', 'database_prefix' ), INSTANCE );
    if( $database == $this->name )
    {
      if( true === self::$debug ) log::debug( '(DB) starting transaction' );
      $this->connection->begin_transaction();
      $this->transaction_state = 'started';
    }
  }

  /**
   * Complete the database transaction.
   * 
   * @access public
   */
  public function complete_transaction()
  {
    if( true === self::$debug ) log::debug( '(DB) completing transaction' );
    $this->connection->commit();
    $this->transaction_state = 'committed';
  }

  /**
   * Fail the current transaction
   * 
   * Calling this method causes the current transaction to fail, causing any changes to the
   * database to be rolled back when the transaction completes.
   * The transaction will automatically fail if there is a database error, this method should
   * only be used when a transaction should fail because of a non-database error.
   * @access public
   */
  public function fail_transaction()
  {
    if( true === self::$debug ) log::debug( '(DB) failing transaction' );
    $this->connection->rollback();
    $this->transaction_state = 'failed';
  }

  /**
   * Returns the current transactional state
   * 
   * @return string (one of 'started', 'committed', 'failed' or NULL
   * @access public
   */
  public function get_transaction_state()
  {
    return $this->transaction_state;
  }

  /**
   * Create a new database savepoint
   * 
   * All transactions which happen after this savepoint can be reversed by calling rollback_savepoint()
   * @param string $name The name of the savepoint
   * @return boolean
   */
  public function savepoint( $name )
  {
    if( true === self::$debug ) log::debug( sprintf( '(DB) adding savepoint "%s"', $name ) );
    $success = $this->connection->savepoint( $name );
    if( !$success ) log::warning( sprintf( 'Unable to create savepoint %s', $name ) );
    return $success;
  }

  /**
   * Remove a database savepoint
   * @param string $name The name of the savepoint
   * @return boolean
   */
  public function release_savepoint( $name )
  {
    if( true === self::$debug ) log::debug( sprintf( '(DB) releasing savepoint "%s"', $name ) );
    $success = $this->connection->release_savepoint( $name );
    if( !$success ) log::warning( sprintf( 'Unable to release savepoint %s', $name ) );
    return $success;
  }

  /**
   * Remove a database savepoint
   * 
   * Reverses all database operations back to when the named savepoint was created
   * @param string $name The name of the savepoint
   * @return boolean
   */
  public function rollback_savepoint( $name )
  {
    if( true === self::$debug ) log::debug( sprintf( '(DB) rolling back to savepoint "%s"', $name ) );
    $success = $this->connection->rollback( MYSQLI_TRANS_COR_AND_CHAIN, $name );
    if( !$success ) log::warning( sprintf( 'Unable to rollback savepoint %s', $name ) );
    return $success;
  }

  /**
   * Commits a database savepoint
   * 
   * Commits all database statements which have occurred since the savepoint was created
   * @param string $name The name of the savepoint
   * @return boolean
   */
  public function commit_savepoint( $name )
  {
    if( true === self::$debug ) log::debug( sprintf( '(DB) commiting savepoint "%s"', $name ) );
    $success = $this->connection->commit( MYSQLI_TRANS_COR_AND_CHAIN, $name );
    if( !$success ) log::warning( sprintf( 'Unable to commit savepoint %s', $name ) );
    return $success;
  }

  /**
   * Get's the name of the database.
   * @return string
   * @access public
   */
  public function get_name() { return $this->name; }

  /**
   * Determines whether a particular table exists.
   * @param string $table_name The name of the table to check for.
   * @return boolean
   * @access public
   */
  public function table_exists( $table_name )
  {
    return array_key_exists( $table_name, $this->tables );
  }

  /**
   * Returns whether the record's associated table has a specific column name.
   * @param string $table_name A table name.
   * @param string $column_name A column name
   * @return boolean
   * @access public
   */
  public function column_exists( $table_name, $column_name )
  {
    return is_string( $table_name ) &&
           is_string( $column_name ) &&
           array_key_exists( $table_name, $this->tables ) &&
           array_key_exists( $column_name, $this->tables[$table_name]['columns'] );
  }

  /**
   * Returns an array of all table names.
   * @return array( string )
   * @access public
   */
  public function get_table_names()
  {
    return array_keys( $this->tables );
  }

  /**
   * Returns an array of column names for the given table.
   * @param string $table_name A table name.
   * @return array( string )
   * @access public
   */
  public function get_column_names( $table_name )
  {
    if( !$this->table_exists( $table_name ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Tried to get column names for table "%s" which doesn\'t exist.',
                 $table_name ), __METHOD__ );

    return array_keys( $this->tables[$table_name]['columns'] );
  }

  /**
   * Returns a column's type (int(10) unsigned, varchar(45), enum( 'a', 'b', 'c' ), etc)
   * @param string $table_name The name of the table to check for.
   * @param string $column_name A column name in the record's corresponding table.
   * @return string
   * @access public
   */
  public function get_column_type( $table_name, $column_name )
  {
    if( !$this->column_exists( $table_name, $column_name ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Tried to get column type for "%s.%s" which doesn\'t exist.',
                 $table_name,
                 $column_name ), __METHOD__ );

    return $this->tables[$table_name]['columns'][$column_name]['type'];
  }

  /**
   * Returns a column's data type (int, varchar, enum, etc)
   * @param string $table_name The name of the table to check for.
   * @param string $column_name A column name in the record's corresponding table.
   * @return string
   * @access public
   */
  public function get_column_data_type( $table_name, $column_name )
  {
    if( !$this->column_exists( $table_name, $column_name ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Tried to get column data type for "%s.%s" which doesn\'t exist.',
                 $table_name,
                 $column_name ), __METHOD__ );

    return $this->tables[$table_name]['columns'][$column_name]['data_type'];
  }

  /**
   * Returns whether a column is being check constrained into JSON format
   * @param string $table_name The name of the table to check for.
   * @param string $column_name A column name in the record's corresponding table.
   * @return boolean
   * @access public
   */
  public function get_column_json( $table_name, $column_name )
  {
    if( !$this->column_exists( $table_name, $column_name ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Tried to get json status for "%s.%s" which doesn\'t exist.',
                 $table_name,
                 $column_name ), __METHOD__ );

    return $this->tables[$table_name]['columns'][$column_name]['json'];
  }

  /**
   * Convertns a column's data type into a native PHP variable type (int, string, boolean, etc)
   * @param string $table_name The name of the table to check for.
   * @param string $column_name A column name in the record's corresponding table.
   * @return string
   * @access public
   */
  public function get_column_variable_type( $table_name, $column_name )
  {
    $boolean_types = array( 'tinyint' );
    $datetime_types = array( 'date', 'datetime' );
    $time_types = array( 'time' );
    $timestamp_types = array( 'timestamp' );
    $integer_types = array( 'bigint', 'int', 'mediumint', 'smallint' );
    $float_types = array( 'decimal', 'double', 'float', 'real' );
    $string_types = array( 'blob', 'char', 'enum', 'longtext', 'text', 'varchar', 'mediumtext' );

    $data_type = $this->get_column_data_type( $table_name, $column_name );
    if( in_array( $data_type, $string_types ) ) return 'string';
    if( in_array( $data_type, $integer_types ) ) return 'integer';
    if( in_array( $data_type, $datetime_types ) ) return 'datetime';
    if( in_array( $data_type, $time_types ) ) return 'time';
    if( in_array( $data_type, $timestamp_types ) ) return 'timestamp';
    if( in_array( $data_type, $boolean_types ) ) return 'boolean';
    if( in_array( $data_type, $float_types ) ) return 'float';

    log::warning( sprintf(
      'Database contains column type "%s" which is not categorized by database layer',
      $data_type ) );
    return 'string';
  }

  /**
   * Returns a column's key type.
   * @param string $table_name The name of the table to check for.
   * @param string $column_name A column name in the record's corresponding table.
   * @return string
   * @access public
   */
  public function get_column_key( $table_name, $column_name )
  {
    if( !$this->column_exists( $table_name, $column_name ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Tried to get column key for "%s.%s" which doesn\'t exist.',
                 $table_name,
                 $column_name ), __METHOD__ );

    return $this->tables[$table_name]['columns'][$column_name]['key'];
  }

  /**
   * Returns an associative list of metadata for all columns
   * @param string $table_name The name of the table to check for.
   * @return string
   * @access public
   */
  public function get_column_details( $table_name )
  {
    if( !$this->table_exists( $table_name ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Tried to get unique keys for table "%s" which doesn\'t exist.', $table_name ),
        __METHOD__ );

    return $this->tables[$table_name]['columns'];
  }

  /**
   * Returns a column's max_length.
   * @param string $table_name The name of the table to check for.
   * @param string $column_name A column name in the record's corresponding table.
   * @return string
   * @access public
   */
  public function get_column_max_length( $table_name, $column_name )
  {
    if( !$this->column_exists( $table_name, $column_name ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Tried to get column max_length for "%s.%s" which doesn\'t exist.',
                 $table_name,
                 $column_name ), __METHOD__ );

    return $this->tables[$table_name]['columns'][$column_name]['max_length'];
  }

  /**
   * Returns a column's default.
   * @param string $table_name The name of the table to check for.
   * @param string $column_name A column name in the record's corresponding table.
   * @return string
   * @access public
   */
  public function get_column_default( $table_name, $column_name )
  {
    if( !$this->column_exists( $table_name, $column_name ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Tried to get column default for "%s.%s" which doesn\'t exist.',
                 $table_name,
                 $column_name ), __METHOD__ );

    return $this->tables[$table_name]['columns'][$column_name]['default'];
  }

  /**
   * This method returns an array of unique keys with the key-value pair being the key's name
   * and an array of column names belonging to that key, respectively.
   * @param string $table_name The name of the table to check for.
   * @return associative array.
   * @access public
   */
  public function get_unique_keys( $table_name )
  {
    if( !$this->table_exists( $table_name ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Tried to get unique keys for table "%s" which doesn\'t exist.', $table_name ),
        __METHOD__ );

    return array_key_exists( $table_name, $this->tables )
         ? $this->tables[$table_name]['constraints']
         : array();
  }

  /**
   * Gets the primary key names for a given table.
   * @return array( string )
   * @param string $table_name A table name.
   * @access public
   */
  public function get_primary_key( $table_name )
  {
    if( !$this->table_exists( $table_name ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Tried to get primary key for table "%s" which doesn\'t exist.', $table_name ),
        __METHOD__ );

    return array_key_exists( $table_name, $this->tables )
         ? $this->tables[$table_name]['primary']
         : array();
  }

  /**
   * Database convenience method.
   * 
   * Execute SQL statement $sql and return derived class of ADORecordSet if successful. Note that a
   * record set is always returned on success, even if we are executing an insert or update
   * statement.
   * @param string $sql SQL statement
   * @param boolean $add_database_names Whether to automatically add database names to the query
   * @param boolean $ignore_deadlocks Whether to ignore deadlocks when they happen
   * @return ADORecordSet
   * @throws exception\database
   * @access public
   */
  public function execute( $sql, $add_database_names = true, $ignore_deadlocks = false )
  {
    $util_class_name = lib::get_class_name( 'util' );

    if( $add_database_names ) $sql = $this->add_database_names( $sql );

    if( self::$debug )
    {
      $method = self::$backtrace ? 'warning' : 'debug';
      $time = $util_class_name::get_elapsed_time();
      log::$method( "(DB) executing:\n".$sql );
    }
    $result = $this->connection->query( $sql );
    if( false === $result )
    {
      // if a deadlock or lock-wait timout has occurred then notify the user with a notice
      if( 1213 == $this->connection->errno || 1205 == $this->connection->errno )
      {
        if( !$ignore_deadlocks )
        {
          log::warning( "Deadlock has prevented the following query from completing:\n".$sql );
          throw lib::create( 'exception\notice',
            'The server was too busy to complete your request, please try again. '.
            'If this error persists please contact support.' , __METHOD__ );
        }
      }
      else
      {
        // pass the db error code instead of a class error code
        throw lib::create( 'exception\database',
          $this->connection->error, $sql, $this->connection->errno );
      }
    }

    if( self::$debug ) log::debug( sprintf( '(DB) affected rows %d [%0.2fs]',
                                            $this->connection->affected_rows,
                                            $util_class_name::get_elapsed_time() - $time ) );

    return $this->connection->affected_rows;
  }

  /**
   * Database convenience method.
   * 
   * Executes the SQL and returns the first field of the first row.
   * @param string $sql SQL statement
   * @return native or NULL if no records were found.
   * @throws exception\database
   * @access public
   */
  public function get_one( $sql, $add_database_names = true )
  {
    $util_class_name = lib::get_class_name( 'util' );

    if( $add_database_names ) $sql = $this->add_database_names( $sql );

    if( true === self::$debug )
    {
      $method = self::$backtrace ? 'warning' : 'debug';
      $time = $util_class_name::get_elapsed_time();
      log::$method( "(DB) getting one:\n".$sql );
    }
    $result = $this->connection->query( $sql );
    if( false === $result )
    {
      // pass the db error code instead of a class error code
      throw lib::create( 'exception\database',
        $this->connection->error, $sql, $this->connection->errno );
    }

    $array = $result->fetch_array( MYSQLI_NUM );
    $result->free();
    $value = is_null( $array ) ? NULL : current( $array );
    if( true === self::$debug ) log::debug( sprintf( '(DB) result "%s" [%0.2fs]',
                                            $value,
                                            $util_class_name::get_elapsed_time() - $time ) );
    return $value;
  }

  /**
   * Database convenience method.
   * 
   * Executes the SQL and returns the first row as an array.
   * @param string $sql SQL statement
   * @return array (empty if no records are found)
   * @throws exception\database
   * @access public
   */
  public function get_row( $sql, $add_database_names = true )
  {
    $util_class_name = lib::get_class_name( 'util' );

    if( $add_database_names ) $sql = $this->add_database_names( $sql );

    if( true === self::$debug )
    {
      $method = self::$backtrace ? 'warning' : 'debug';
      $time = $util_class_name::get_elapsed_time();
      log::$method( "(DB) getting row:\n".$sql );
    }
    $result = $this->connection->query( $sql );
    if( false === $result )
    {
      // pass the db error code instead of a class error code
      throw lib::create( 'exception\database',
        $this->connection->error, $sql, $this->connection->errno );
    }

    $row = $result->fetch_assoc();
    $result->free();
    if( true === self::$debug )
      log::debug( is_null( $row )
        ? sprintf( '(DB) did not return a row [%0.2fs]',
                   $util_class_name::get_elapsed_time() - $time )
        : sprintf( '(DB) returned row with %d column(s) [%0.2fs]',
                   count( $row ),
                   $util_class_name::get_elapsed_time() - $time ) );

    return $row;
  }

  /**
   * Database convenience method.
   * 
   * Executes the SQL and returns the all the rows as a 2-dimensional array.
   * @param string $sql SQL statement
   * @return array (empty if no records are found)
   * @throws exception\database
   * @access public
   */
  public function get_all( $sql, $add_database_names = true )
  {
    $util_class_name = lib::get_class_name( 'util' );

    if( $add_database_names ) $sql = $this->add_database_names( $sql );

    if( true === self::$debug )
    {
      $method = self::$backtrace ? 'warning' : 'debug';
      $time = $util_class_name::get_elapsed_time();
      log::$method( "(DB) getting all:\n".$sql );
    }
    $result = $this->connection->query( $sql );
    if( false === $result )
    {
      // pass the db error code instead of a class error code
      throw lib::create( 'exception\database',
        $this->connection->error, $sql, $this->connection->errno );
    }

    $rows = array();
    while( $row = $result->fetch_assoc() ) $rows[] = $row;
    $result->free();

    if( true === self::$debug ) log::debug( sprintf( '(DB) returned %d rows [%0.2fs]',
                                            $rows ? count( $rows ) : 0,
                                            $util_class_name::get_elapsed_time() - $time ) );
    return $rows;
  }

  /**
   * Database convenience method.
   * 
   * Executes the SQL and returns all elements of the first column as a 1-dimensional array.
   * @param string $sql SQL statement
   * @return array (empty if no records are found)
   * @throws exception\database
   * @access public
   */
  public function get_col( $sql, $add_database_names = true )
  {
    $util_class_name = lib::get_class_name( 'util' );

    if( $add_database_names ) $sql = $this->add_database_names( $sql );

    if( true === self::$debug )
    {
      $method = self::$backtrace ? 'warning' : 'debug';
      $time = $util_class_name::get_elapsed_time();
      log::$method( "(DB) getting col:\n".$sql );
    }
    $result = $this->connection->query( $sql );
    if( false === $result )
    {
      // pass the database error code instead of a class error code
      throw lib::create( 'exception\database',
        $this->connection->error, $sql, $this->connection->errno );
    }

    $cols = array();
    while( $row = $result->fetch_array( MYSQLI_NUM ) ) $cols[] = current( $row );
    $result->free();
    if( true === self::$debug ) log::debug( sprintf( '(DB) returned %d values [%0.2fs]',
                                            count( $cols ),
                                            $util_class_name::get_elapsed_time() - $time ) );

    return $cols;
  }

  /**
   * Database convenience method.
   * 
   * Returns the last autonumbering ID inserted.
   * @return int
   * @access public
   */
  public function insert_id()
  {
    $id = $this->connection->insert_id;
    if( true === self::$debug ) log::debug( '(DB) insert ID = '.$id );
    return $id;
  }

  /**
   * Database convenience method.
   * 
   * Returns the number of rows affected by a update or delete statement.
   * @return int
   * @access public
   */
  public function affected_rows()
  {
    $num = $this->connection->affected_rows;
    if( true === self::$debug ) log::debug( '(DB) affected rows = '.$num );
    return $num;
  }

  /**
   * Returns the string formatted for database queries.
   * 
   * The returned value will be put in double quotes unless the input is null in which case NULL
   * is returned.
   * @param string $string The string to format for use in a query.
   * @param boolean $json Whether the string being encoded is in JSON format
   * @return string
   * @access public
   */
  public function format_string( $string, $json = false )
  {
    // NULL values are returned as a MySQL NULL value
    if( is_null( $string ) ) return 'NULL';

    // boolean values must be converted to strings (without double-quotes)
    if( is_bool( $string ) ) return $string ? 'true' : 'false';

    // trim whitespace from the begining and end of the string and replace unusual characters
    if( is_string( $string ) ) $string = trim( str_replace(
      array( ' ', '`', '“', '”', "’'", '¸', '–' ),
      // note that when converting double quotes in a JSON string they must be escaped by two backslashes
      array( ' ', "'", $json ? '\\"' : '"', $json ? '\\"' : '"', $json ? '\\"' : '"', ',', '-' ),
      $string
    ) );

    // Note: the normalizer will convert combination characters to standard versions
    return 0 == strlen( $string ) ?  'NULL' : (
      sprintf( '"%s"', \Normalizer::normalize( $this->connection->real_escape_string( $string ), \Normalizer::FORM_KC ) )
    );
  }

  /**
   * Returns the datetime string formatted for database queries.
   * 
   * The returned value will be put in double quotes unless the input is null in which case NULL
   * is returned.
   * @param string|DateTime $datetime The string or DateTime object to format for use in a query.
   * @return string
   * @access public
   */
  public function format_datetime( $datetime )
  {
    $util_class_name = lib::get_class_name( 'util' );

    // convert string to datetime object
    if( is_string( $datetime ) && 0 < strlen( $datetime ) )
      $datetime = $util_class_name::get_datetime_object( $datetime );
    return $datetime instanceof \DateTime ? '"'.$datetime->format( 'Y-m-d H:i:s' ).'"' : 'NULL';
  }

  /**
   * Returns the date string formatted for database queries.
   * 
   * The returned value will be put in double quotes unless the input is null in which case NULL
   * is returned.
   * @param string|DateTime $date The string or DateTime object to format for use in a query.
   * @return string
   * @access public
   */
  public function format_date( $date )
  {
    $util_class_name = lib::get_class_name( 'util' );

    // convert string to date object
    if( is_string( $date ) && 0 < strlen( $date ) )
      $date = $util_class_name::get_datetime_object( $date );
    return $date instanceof \DateTime ? '"'.$date->format( 'Y-m-d' ).'"' : 'NULL';
  }

  /**
   * Returns the time string formatted for database queries.
   * 
   * The returned value will be put in double quotes unless the input is null in which case NULL
   * is returned.
   * @param string|DateTime $time The string or DateTime object to format for use in a query.
   * @return string
   * @access public
   */
  public function format_time( $time )
  {
    $util_class_name = lib::get_class_name( 'util' );

    // convert string to time object
    if( is_string( $time ) && 0 < strlen( $time ) )
      $time = $util_class_name::get_datetime_object( $time );
    return $time instanceof \DateTime ? '"'.$time->format( 'H:i:s' ).'"' : 'NULL';
  }

  /**
   * Returns a version of the string with all framework and application table names prefixed
   * with their database name.
   * @param string $input An sql string
   * @return string
   * @access protected
   */
  protected function add_database_names( $input )
  {
    $split_words =
      array( 'DUPLICATE KEY UPDATE', 'UPDATE', 'INSERT', 'REPLACE', 'SELECT', 'DELETE', 'INTO',
             'FROM', 'LEFT JOIN', 'RIGHT JOIN', 'STRAIGHT JOIN', 'CROSS JOIN', 'JOIN', 'VALUES',
             'VALUE', 'SET', 'WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT', 'PROCEDURE', 'INTO',
             'FOR', 'ON' );

    // split the sql based on the words above, then process each piece one at a time
    // note on the regular expression:
    // \b(%s)\b: matches any keyword surrounded by word boundaries
    // (\\\\\\\\): matches any double-backslash \\
    // (\\\\\'): matches any escaped single-quote \'
    // (\\\"): matches any escaped double-quote \"
    // (\'): matches any single-quote which is not escaped
    // ("): matches any double-quote which is not escaped
    $pieces = preg_split( sprintf( '/\b(%s)\b|(\\\\\\\\)|(\\\\\')|(\\\")|(\')|(")/i', implode( '|', $split_words ) ),
                          $input,
                          -1,
                          PREG_SPLIT_NO_EMPTY | PREG_SPLIT_DELIM_CAPTURE );

    if( 2 > count( $pieces ) ) $output = $input;
    else
    {
      $output = '';
      $first_piece = true;
      $in_update = false;
      $in_insert = false;
      $in_replace = false;
      $in_from = false;
      $in_join = false;
      $in_single_quote = false;
      $in_double_quote = false;
      foreach( $pieces as $piece )
      {
        $piece_upper = strtoupper( $piece );

        // start by checking for the opening boundary of table names
        if( "'" == $piece_upper )
        {
          $in_single_quote = !$in_single_quote;
          $output .= $piece;
        }
        else if( '"' == $piece_upper )
        {
          $in_double_quote = !$in_double_quote;
          $output .= $piece;
        }
        else if( $in_single_quote || $in_double_quote )
        { // ignore anything inside quotes
          $output .= $piece;
        }
        else
        {
          if( 'UPDATE' == $piece_upper )
          {
            $in_update = true;
            $output .= $piece;
          }
          else if( 'INTO' == $piece_upper )
          {
            $in_insert = true;
            $in_replace = true;
            $output .= $piece;
          }
          else if( 'FROM' == $piece_upper )
          {
            $in_from = true;
            $output .= $piece;
          }
          else if( 'LEFT JOIN' == $piece_upper ||
                   'RIGHT JOIN' == $piece_upper ||
                   'STRAIGHT JOIN' == $piece_upper ||
                   'CROSS JOIN' == $piece_upper ||
                   'JOIN' == $piece_upper )
          {
            $in_join = true;
            $output .= $piece;
          }
          // not an opening boundary, so if we're not in a boundary so there's nothing to do
          else if( !( $in_update || $in_insert || $in_replace || $in_from || $in_join ) )
          {
            $output .= $piece;
          }
          // not an opening boundary and we are in some boundary, see if we're closing a boundary
          else if( 'DUPLICATE KEY UPDATE' == $piece_upper )
          {
            $in_insert = false;
            $output .= $piece;
          }
          else if( 'SET' == $piece_upper )
          {
            $in_update = false;
            $in_insert = false;
            $in_replace = false;
            $output .= $piece;
          }
          else if( 'VALUES' == $piece_upper ||
                   'VALUE' == $piece_upper ||
                   'SELECT' == $piece_upper )
          {
            $in_insert = false;
            $in_replace = false;
            $output .= $piece;
          }
          else if( 'ON' == $piece_upper )
          {
            $in_join = false;
            $output .= $piece;
          }
          else if( 'WHERE' == $piece_upper ||
                   'GROUP' == $piece_upper ||
                   'HAVING' == $piece_upper ||
                   'ORDER' == $piece_upper ||
                   'LIMIT' == $piece_upper ||
                   'PROCEDURE' == $piece_upper ||
                   'INTO' == $piece_upper ||
                   'FOR' == $piece_upper )
          {
            $in_from = false;
            $in_join = false;
            $output .= $piece;
          }
          else // in a boundary, not closing it, so process the table names in the piece
          {
            $first_string = true;
            foreach( explode( ',', $piece ) as $table_string )
            {
              $output .= $first_string ? ' ' : ', ';
              if( $first_string ) $first_string = false;
              $table_words = preg_split( '/[ ()]/', trim( $table_string ), 2 );
              if( array_key_exists( $table_words[0], $this->tables ) )
                $output .= $this->tables[$table_words[0]]['database'].'.';
              $output .= ltrim( $table_string, ' ' );
            }
          }
        }
      }
    }

    return $output;
  }

  /**
   * Returns whether the column name is of type "date"
   * @param string $column_name Any (generic) column name
   * @return boolean
   * @static
   * @access public
   */
  public static function is_date_column( $column_name )
  {
    $pos = strpos( $column_name, '.' );
    $column = false === $pos ? $column_name : substr( $column_name, $pos+1 );
    return 'date' == $column || '_date' == substr( $column, -5 );
  }

  /**
   * Returns whether the column name is of type "time"
   * @param string $column_name Any (generic) column name
   * @return boolean
   * @static
   * @access public
   */
  public static function is_time_column( $column_name )
  {
    $pos = strpos( $column_name, '.' );
    $column = false === $pos ? $column_name : substr( $column_name, $pos+1 );
    return 'time' == $column || '_time' == substr( $column, -5 );
  }

  /**
   * Returns whether the column name is of type "datetime"
   * @param string $column_name Any (generic) column name
   * @return boolean
   * @static
   * @access public
   */
  public static function is_datetime_column( $column_name )
  {
    $pos = strpos( $column_name, '.' );
    $column = false === $pos ? $column_name : substr( $column_name, $pos+1 );
    return 'datetime' == $column || '_datetime' == substr( $column, -9 );
  }

  /**
   * When set to true all queries will be sent to the debug log
   * @var boolean
   * @static
   * @access public
   */
  public static $debug = false;

  /**
   * When set to true debug queries will include a backtrace
   * @var boolean
   * @static
   * @access public
   */
  public static $backtrace = false;

  /**
   * Holds all table information including database, columns, unique key constraints.
   * @var array
   * @access protected
   */
  protected $tables = array();

  /**
   * A reference to the mysqli resource.
   * @var resource
   * @access protected
   */
  protected $connection;

  /**
   * Tracks which database was connected to last.
   * @var string
   * @static
   * @access protected
   */
  protected static $current_database = '';

  /**
   * The server that the database is located
   * @var string
   * @access private
   */
  private $server;

  /**
   * Which username to use when connecting to the database
   * @var string
   * @access private
   */
  private $username;

  /**
   * Which password to use when connecting to the database
   * @var string
   * @access private
   */
  private $password;

  /**
   * The name of the database.
   * @var string
   * @access private
   */
  private $name;

  /**
   * Keeps track of the transactional state
   * @var string
   * @access private
   */
  private $transaction_state = NULL;
}

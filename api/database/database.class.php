<?php
/**
 * database.class.php
 * For now see {@link connect} for the current hack/solution.
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * @category external
 */
require_once ADODB_PATH.'/adodb.inc.php';

/**
 * The database class represents a database connection and information.
 */
class database extends \cenozo\base_object
{
  /**
   * Constructor
   * 
   * The constructor either creates a new connection to a database.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $driver The type of database (only mysql is tested)
   * @param string $server The name of the database's server
   * @param string $username The username to connect with.
   * @param string $password The password to connect with.
   * @param string $database The name of the database.
   * @param string $prefix The prefix to add before every table name.
   * @throws exception\runtime
   * @access public
   */
  public function __construct( $driver, $server, $username, $password, $database, $prefix )
  {
    $this->driver = 'mysql' == $driver ? 'mysqlt' : $driver;
    $this->server = $server;
    $this->username = $username;
    $this->password = $password;
    $this->name = $database;
    $this->prefix = $prefix;
    
    // set up the database connection
    $this->connection = ADONewConnection( $this->driver );
    $this->connection->SetFetchMode( ADODB_FETCH_ASSOC );
    
    $this->connect();

    $column_mod = lib::create( 'database\modifier' );
    $column_mod->where( 'TABLE_SCHEMA', '=', $this->name );
    $column_mod->where( 'COLUMN_NAME', '!=', 'update_timestamp' ); // ignore timestamp columns
    $column_mod->where( 'COLUMN_NAME', '!=', 'create_timestamp' );
    $column_mod->where( 'COLUMN_TYPE', '!=', 'mediumtext' ); // ignore really big data types
    $column_mod->where( 'COLUMN_TYPE', '!=', 'longtext' );
    $column_mod->where( 'COLUMN_TYPE', '!=', 'mediumblob' );
    $column_mod->where( 'COLUMN_TYPE', '!=', 'longblob' );
    $column_mod->order( 'TABLE_NAME' );
    $column_mod->order( 'COLUMN_NAME' );

    $rows = $this->get_all(
      sprintf( 'SELECT TABLE_NAME AS table_name, '.
                      'COLUMN_NAME AS column_name, '.
                      'COLUMN_TYPE AS column_type, '.
                      'DATA_TYPE AS data_type, '.
                      'COLUMN_KEY AS column_key, '.
                      'COLUMN_DEFAULT AS column_default '.
               'FROM information_schema.COLUMNS %s ',
               $column_mod->get_sql() ) );
    
    // record the tables, columns and types
    foreach( $rows as $row )
    {
      extract( $row ); // defines $table_name, $column_name and $column_type

      if( !array_key_exists( $table_name, $this->columns ) )
        $this->columns[$table_name] = array();

      $this->columns[$table_name][$column_name] =
        array( 'data_type' => $data_type,
               'type' => $column_type,
               'default' => $column_default,
               'key' => $column_key );
    }

    $constraint_mod = lib::create( 'database\modifier' );
    $constraint_mod->where( 'TABLE_CONSTRAINTS.TABLE_SCHEMA', '=', $this->name );
    $constraint_mod->where( 'KEY_COLUMN_USAGE.TABLE_SCHEMA', '=', $this->name );
    $constraint_mod->where( 'TABLE_CONSTRAINTS.CONSTRAINT_TYPE', '=', 'UNIQUE' );
    $constraint_mod->where(
      'TABLE_CONSTRAINTS.CONSTRAINT_NAME', '=', 'KEY_COLUMN_USAGE.CONSTRAINT_NAME', false );
    $constraint_mod->group( 'table_name' );
    $constraint_mod->group( 'constraint_name' );
    $constraint_mod->group( 'column_name' );
    $constraint_mod->order( 'table_name' );
    $constraint_mod->order( 'constraint_name' );
    $constraint_mod->order( 'column_name' );
    
    $rows = $this->get_all(
      sprintf( 'SELECT TABLE_CONSTRAINTS.TABLE_NAME table_name, '.
                      'TABLE_CONSTRAINTS.CONSTRAINT_NAME AS constraint_name, '.
                      'KEY_COLUMN_USAGE.COLUMN_NAME AS column_name '.
               'FROM information_schema.TABLE_CONSTRAINTS, information_schema.KEY_COLUMN_USAGE %s',
               $constraint_mod->get_sql() ) );
    
    // record the tables, columns and types
    foreach( $rows as $row )
    {
      extract( $row ); // defines $table_name, $constraint_name and $column_name
      if( !array_key_exists( $table_name, $this->tables ) )
        $this->tables[$table_name] = array();
      if( !array_key_exists( 'constraints', $this->tables[$table_name] ) )
        $this->tables[$table_name]['constraints'] = array();

      $this->tables[$table_name]['constraints'][$constraint_name][] = $column_name;
    }
  }

  /**
   * Start a database transaction.
   * Transactions are automatically completed in the destructor.  To force-fail (rollback)
   * a transaction call fail_transaction()
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function start_transaction()
  {
    // only start a transaction for the main database (this is an ADOdb limitation)
    if( lib::create( 'business\setting_manager' )->get_setting( 'db', 'database' ) == $this->name )
    {
      if( self::$debug ) log::debug( '(DB) starting transaction' );
      $this->connection->StartTrans();
    }
  }
  
  /**
   * Complete the database transaction.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function complete_transaction()
  {
    // only complete a transaction for the main database (this is an ADOdb limitation)
    $class_name = lib::get_class_name( 'business\setting_manager' );
    if( class_exists( 'cenozo\business\setting_manager' ) &&
        $class_name::exists() &&
        lib::create( 'business\setting_manager' )->get_setting( 'db', 'database' ) == $this->name )
    {
      if( self::$debug ) log::debug( '(DB) completing transaction' );
      $this->connection->CompleteTrans();
    }
  }

  /**
   * Fail the current transaction
   * 
   * Calling this method causes the current transaction to fail, causing any changes to the
   * database to be rolled back when the transaction completes.
   * The transaction will automatically fail if there is a database error, this method should
   * only be used when a transaction should fail because of a non-database error.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function fail_transaction()
  {
    if( self::$debug ) log::debug( '(DB) failing transaction' );
    $this->connection->FailTrans();
  }

  /**
   * Get's the name of the database.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_name() { return $this->name; }

  /**
   * Get's the prefix of the database.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_prefix() { return $this->prefix; }

  /**
   * Determines whether a particular table exists.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $table_name The name of the table to check for.
   * @return boolean
   * @access public
   */
  public function table_exists( $table_name )
  {
    $table_name = $this->prefix.$table_name;
    return array_key_exists( $table_name, $this->columns );
  }

  /**
   * Returns whether the record's associated table has a specific column name.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $table_name A table name.
   * @param string $column_name A column name
   * @return boolean
   * @access public
   */
  public function column_exists( $table_name, $column_name )
  {
    $table_name = $this->prefix.$table_name;
    return array_key_exists( $table_name, $this->columns ) &&
           array_key_exists( $column_name, $this->columns[$table_name] );
  }
  
  /**
   * Returns an array of column names for the given table.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $table_name A table name.
   * @return array( string )
   * @access public
   */
  public function get_column_names( $table_name )
  {
    if( !$this->table_exists( $table_name ) )
      throw lib::create( 'exception\runtime',
        sprintf( "Tried to get column names for table '%s' which doesn't exist.",
                 $table_name ), __METHOD__ );

    $table_name = $this->prefix.$table_name;
    return array_keys( $this->columns[$table_name] );
  }

  /**
   * Returns a column's type (int, varchar, enum, etc)
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $table_name The name of the table to check for.
   * @param string $column_name A column name in the record's corresponding table.
   * @return string
   * @access public
   */
  public function get_column_type( $table_name, $column_name )
  {
    if( !$this->column_exists( $table_name, $column_name ) )
      throw lib::create( 'exception\runtime',
        sprintf( "Tried to get column type for '%s.%s' which doesn't exist.",
                 $table_name,
                 $column_name ), __METHOD__ );

    $table_name = $this->prefix.$table_name;
    return $this->columns[$table_name][$column_name]['type'];
  }
  
  /**
   * Returns a column's data type (int(10) unsigned, varchar(45), enum( 'a', 'b', 'c' ), etc)
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $table_name The name of the table to check for.
   * @param string $column_name A column name in the record's corresponding table.
   * @return string
   * @access public
   */
  public function get_column_data_type( $table_name, $column_name )
  {
    if( !$this->column_exists( $table_name, $column_name ) )
      throw lib::create( 'exception\runtime',
        sprintf( "Tried to get column data type for '%s.%s' which doesn't exist.",
                 $table_name,
                 $column_name ), __METHOD__ );

    $table_name = $this->prefix.$table_name;
    return $this->columns[$table_name][$column_name]['data_type'];
  }
  
  /**
   * Returns a column's key type.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $table_name The name of the table to check for.
   * @param string $column_name A column name in the record's corresponding table.
   * @return string
   * @access public
   */
  public function get_column_key( $table_name, $column_name )
  {
    if( !$this->column_exists( $table_name, $column_name ) )
      throw lib::create( 'exception\runtime',
        sprintf( "Tried to get column key for '%s.%s' which doesn't exist.",
                 $table_name,
                 $column_name ), __METHOD__ );

    $table_name = $this->prefix.$table_name;
    return $this->columns[$table_name][$column_name]['key'];
  }
  
  /**
   * Returns a column's default.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $table_name The name of the table to check for.
   * @param string $column_name A column name in the record's corresponding table.
   * @return string
   * @access public
   */
  public function get_column_default( $table_name, $column_name )
  {
    if( !$this->column_exists( $table_name, $column_name ) )
      throw lib::create( 'exception\runtime',
        sprintf( "Tried to get column default for '%s.%s' which doesn't exist.",
                 $table_name,
                 $column_name ), __METHOD__ );

    $table_name = $this->prefix.$table_name;
    return $this->columns[$table_name][$column_name]['default'];
  }
  
  /**
   * This method returns an array of unique keys with the key-value pair being the key's name
   * and an array of column names belonging to that key, respectively.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $table_name The name of the table to check for.
   * @return associative array.
   * @access public
   */
  public function get_unique_keys( $table_name )
  {
    if( !$this->table_exists( $table_name ) )
      throw lib::create( 'exception\runtime',
        sprintf( "Tried to get unique keys for table '%s' which doesn't exist.", $table_name ),
        __METHOD__ );

    $table_name = $this->prefix.$table_name;
    return array_key_exists( $table_name, $this->tables )
         ? $this->tables[$table_name]['constraints']
         : array();
  }
  
  /**
   * Gets the primary key names for a given table.
   * Note: This is a wrapper for ADOdb::MetaPrimaryKeys()
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array( string )
   * @param string $table_name A table name.
   * @access public
   */
  public function meta_primary_keys( $table_name )
  {
    $table_name = $this->prefix.$table_name;
    $this->connect();
    return $this->connection->MetaPrimaryKeys( $table_name );
  }

  /**
   * Database convenience method.
   * 
   * Execute SQL statement $sql and return derived class of ADORecordSet if successful. Note that a
   * record set is always returned on success, even if we are executing an insert or update
   * statement.
   * Note: This is a wrapper for ADOdb::Execute()
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $sql SQL statement
   * @return ADORecordSet
   * @throws exception\database
   * @access public
   */
  public function execute( $sql )
  {
    $this->connect();
    if( self::$debug ) log::debug( '(DB) executing "'.$sql.'"' );
    $result = $this->connection->Execute( $sql );
    if( false === $result )
    {
      // pass the db error code instead of a class error code
      throw lib::create( 'exception\database',
        $this->connection->ErrorMsg(), $sql, $this->connection->ErrorNo() );
    }

    return $result;
  }
  
  /**
   * Database convenience method.
   * 
   * Executes the SQL and returns the first field of the first row.
   * Note: This is a wrapper for ADOdb::GetOne()
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $sql SQL statement
   * @return native or NULL if no records were found.
   * @throws exception\database
   * @access public
   */
  public function get_one( $sql )
  {
    $this->connect();
    if( self::$debug ) log::debug( '(DB) getting one "'.$sql.'"' );
    $result = $this->connection->GetOne( $sql );
    if( false === $result )
    {
      // pass the db error code instead of a class error code
      throw lib::create( 'exception\database',
        $this->connection->ErrorMsg(), $sql, $this->connection->ErrorNo() );
    }

    if( self::$debug ) log::debug( '(DB) result "'.$result.'"' );
    return $result;
  }
  
  /**
   * Database convenience method.
   * 
   * Executes the SQL and returns the first row as an array.
   * Note: This is a wrapper for ADOdb::GetRow()
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $sql SQL statement
   * @return array (empty if no records are found)
   * @throws exception\database
   * @access public
   */
  public function get_row( $sql )
  {
    $this->connect();
    if( self::$debug ) log::debug( '(DB) getting row "'.$sql.'"' );
    $result = $this->connection->GetRow( $sql );
    if( false === $result )
    {
      // pass the db error code instead of a class error code
      throw lib::create( 'exception\database',
        $this->connection->ErrorMsg(), $sql, $this->connection->ErrorNo() );
    }

    if( self::$debug ) log::debug( '(DB) returned '.( count( $result ) ? 1 : 0 ).' row' );
    return $result;
  }
  
  /**
   * Database convenience method.
   * 
   * Executes the SQL and returns the all the rows as a 2-dimensional array.
   * Note: This is a wrapper for ADOdb::GetAll()
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $sql SQL statement
   * @return array (empty if no records are found)
   * @throws exception\database
   * @access public
   */
  public function get_all( $sql )
  {
    $this->connect();
    if( self::$debug ) log::debug( '(DB) getting all "'.$sql.'"' );
    $result = $this->connection->GetAll( $sql );
    if( false === $result )
    {
      // pass the db error code instead of a class error code
      throw lib::create( 'exception\database',
        $this->connection->ErrorMsg(), $sql, $this->connection->ErrorNo() );
    }

    if( self::$debug ) log::debug( '(DB) returned '.count( $result ).' rows' );
    return $result;
  }
  
  /**
   * Database convenience method.
   * 
   * Executes the SQL and returns all elements of the first column as a 1-dimensional array.
   * Note: This is a wrapper for ADOdb::GetCol()
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $sql SQL statement
   * @param boolean $trim determines whether to right trim CHAR fields
   * @return array (empty if no records are found)
   * @throws exception\database
   * @access public
   */
  public function get_col( $sql, $trim = false )
  {
    $this->connect();
    if( self::$debug ) log::debug( '(DB) getting col "'.$sql.'"' );
    $result = $this->connection->GetCol( $sql, $trim );
    if( false === $result )
    {
      // pass the database error code instead of a class error code
      throw lib::create( 'exception\database',
        $this->connection->ErrorMsg(), $sql, $this->connection->ErrorNo() );
    }

    if( self::$debug ) log::debug( '(DB) returned '.count( $result ).' rows' );
    return $result;
  }
  
  /**
   * Database convenience method.
   * 
   * Returns the last autonumbering ID inserted.
   * Note: This is a wrapper for ADOdb::Insert_ID()
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return int
   * @access public
   */
  public function insert_id()
  {
    $this->connect();
    $id = $this->connection->Insert_ID();
    if( self::$debug ) log::debug( '(DB) insert ID = '.$id );
    return $id;
  }
  
  /**
   * Database convenience method.
   * 
   * Returns the number of rows affected by a update or delete statement.
   * Note: This is a wrapper for ADOdb::Affected_Rows()
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return int
   * @access public
   */
  public function affected_rows()
  {
    $this->connect();
    $num = $this->connection->Affected_Rows();
    if( self::$debug ) log::debug( '(DB) affected rows = '.$num );
    return $num;
  }
  
  /**
   * Returns the string formatted for database queries.
   * 
   * The returned value will be put in double quotes unless the input is null in which case NULL
   * is returned.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $string The string to format for use in a query.
   * @return string
   * @static
   * @access public
   */
  public static function format_string( $string )
  {
    // NULL values are returned as a MySQL NULL value
    if( is_null( $string ) ) return 'NULL';
    
    // boolean values must be converted to strings (without double-quotes)
    if( is_bool( $string ) ) return $string ? 'true' : 'false';

    // trim whitespace from the begining and end of the string
    if( is_string( $string ) ) $string = trim( $string );
    
    return 0 == strlen( $string ) ? 'NULL' : '"'.mysql_real_escape_string( $string ).'"';
  }
  
  /**
   * Returns whether the column name is of type "date"
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $column_name Any (generic) column name
   * @return boolean
   * @static
   * @access public
   */
  public static function is_date_column( $column_name )
  {
    return 'date' == $column_name || '_date' == substr( $column_name, -5 );
  }

  /**
   * Returns whether the column name is of type "time"
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $column_name Any (generic) column name
   * @return boolean
   * @static
   * @access public
   */
  public static function is_time_column( $column_name )
  {
    return 'time' == $column_name || '_time' == substr( $column_name, -5 );
  }

  /**
   * Returns whether the column name is of type "datetime"
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $column_name Any (generic) column name
   * @return boolean
   * @static
   * @access public
   */
  public static function is_datetime_column( $column_name )
  {
    return 'datetime' == $column_name ||
           '_datetime' == substr( $column_name, -9 );
  }

  /**
   * Since ADODB does not support multiple database with the same driver this method must be
   * called before using the connection member.
   * This method is necessary because ADODB cannot connect to more than one database of the
   * same driver at the same time:
   * http://php.bigresource.com/ADODB-Multiple-Database-Connection-wno2zASC.html
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access private
   */
  private function connect()
  {
    if( $this->name != static::$current_database )
    {
      if( false == $this->connection->Connect(
        $this->server, $this->username, $this->password, $this->name ) )
        throw lib::create( 'exception\runtime',
          sprintf( 'Unable to connect to the "%s" database.', $this->name ), __METHOD__ );
      static::$current_database = $this->name;
    }
  }

  /**
   * When set to true all queries will be sent to the debug log
   * @var boolean
   * @static
   * @access public
   */
  public static $debug = false;

  /**
   * Holds all table column types in an associate array where table => ( column => type )
   * @var array
   * @access protected
   */
  protected $columns = array();

  /**
   * Holds all table information including unique key constraints.
   * @var array
   * @access protected
   */
  protected $tables = array();

  /**
   * A reference to the ADODB resource.
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
   * The database driver (see ADODB for possible values)
   * @var string
   * @access private
   */
  private $driver;

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
   * The table name prefix.
   * @var string
   * @access private
   */
  private $prefix;
}
?>

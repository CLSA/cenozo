<?php
/**
 * database.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\exception;
use cenozo\lib, cenozo\log;

/**
 * database: database/sql exceptions
 *
 * All exceptions which are due to the database, including connection errors and queries, use this
 * class to throw exceptions.
 */
class database extends base_exception
{
  /**
   * Constructor
   * @param string $message A message describing the exception.
   * @param string $sql The SQL statement which caused the exception.
   * @param string|int $context The exceptions context, either a function name or error code.
   * @param exception $previous The previous exception used for the exception chaining.
   * @access public
   */
  public function __construct( $message, $sql = NULL, $context, $previous = NULL )
  {
    $this->sql = $sql;
    $message .= is_null( $this->sql ) ? '' : ' for query'."\n".trim( $sql );
    parent::__construct( $message, $context, $previous );
  }

  /**
   * Returns whether the exception was thrown because of a duplicate entry error.
   * 
   * @return boolean
   * @access public
   */
  public function is_duplicate_entry()
  {
    return DATABASE_CENOZO_BASE_ERRNO + 1062 == $this->get_number();
  }

  /**
   * Returns whether the exception was thrown because of a failed constrained key.
   * 
   * @return boolean
   * @access public
   */
  public function is_constrained()
  {
    return DATABASE_CENOZO_BASE_ERRNO + 1451 == $this->get_number();
  }

  /**
   * Returns whether the exception was thrown because a column which cannot be null is not set.
   * 
   * @return boolean
   * @access public
   */
  public function is_missing_data()
  {
    return DATABASE_CENOZO_BASE_ERRNO + 1048  == $this->get_number();
  }

  /**
   * If the exception is a duplicate entry this returns the columns in the unique key
   * 
   * @param string $table_name: The table name must be provided
   * @return array( string )
   * @access public
   */
  public function get_duplicate_columns( $table_name )
  {
    if( !$this->is_duplicate_entry() ) return NULL;

    $db = lib::create( 'business\session' )->get_database();
    $column_list = array();

    // error string is in the form: "Duplicate entry 'col1-col2-etc' for key 'key_name'"
    $matches = array();
    if( preg_match( "/for key '([^']+)'/", $this->get_raw_message(), $matches ) )
    {
      $unique_key_name = $matches[1];
      $unique_key_list = $db->get_unique_keys( $table_name );
      if( array_key_exists( $unique_key_name, $unique_key_list ) )
        $column_list = $unique_key_list[$unique_key_name];
    }

    return $column_list;
  }

  /**
   * Used to identify which table failed the foreign key constraint
   * 
   * @return string
   * @access public
   */
  public function get_failed_constraint_table()
  {
    if( !$this->is_constrained() ) return NULL;

    $matches = array();
    $result = array();
    $offset = 0;
    while( preg_match( '/`[a-z_]+`/', $this->get_raw_message(), $result, PREG_OFFSET_CAPTURE, $offset ) )
    {
      $matches[] = substr( $result[0][0], 1, -1 );
      $offset = $result[0][1] + 1;
    }

    return 2 <= count( $matches ) ? $matches[1] : NULL;
  }

  /**
   * The sql which caused the exception.
   * @var string
   * @access protected
   */
  protected $sql = NULL;
}

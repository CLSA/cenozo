<?php
/**
 * database.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function is_missing_data()
  {
    return DATABASE_CENOZO_BASE_ERRNO + 1048  == $this->get_number();
  }

  /**
   * The sql which caused the exception.
   * @var string
   * @access protected
   */
  protected $sql = NULL;
}
?>

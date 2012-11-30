<?php
/**
 * ldap.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\exception;
use cenozo\lib, cenozo\log;

/**
 * ldap: ldap file exception
 * 
 * This exception is thrown when trying to include a file that doesn't exist
 */
class ldap extends base_exception
{
  /**
   * Constructor
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $file the ldap file.
   * @param string|int $context The exceptions context, either a function name or error code.
   * @param exception $previous The previous exception used for the exception chaining.
   * @access public
   */
  public function __construct( $message, $context, $previous = NULL )
  {
    // If the error code is negative then add 99000 and make it positive
    // This way a -9 would appear as 399009 instead of 299991
    parent::__construct( $message, self::convert_context( $context ), $previous );
  }

  /**
   * Returns whether the exception was thrown because of trying to create a user that already
   * exists.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function is_already_exists()
  {
    $number = LDAP_CENOZO_BASE_ERRNO + self::convert_context( 68 );
    return $this->get_number() == $number;
  }
  
  /**
   * Returns whether the exception was thrown because of refering to a user which doesn't exist.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function is_does_not_exist()
  {
    $number = LDAP_CENOZO_BASE_ERRNO + self::convert_context( 32 );
    return $this->get_number() == $number;
  }
  
  /**
   * Converts the context to an error number.
   * This is necessary because some native LDAP errors are negative.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return integer
   * @access protected
   */
  protected function convert_context( $number )
  {
    return 0 > $number ? 99000 + abs( $number ) : $number;
  }
}
?>

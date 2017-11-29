<?php
/**
 * permission.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\exception;
use cenozo\lib, cenozo\log;

/**
 * permission: permission exceptions
 * 
 * All exceptions which are due to denied permissions, use this class to throw exceptions.
 */
class permission extends base_exception
{
  /**
   * Constructor
   * @param database\service $db_service The associated service.
   * @param string|int $context The exceptions context, either a function name or error code.
   * @param exception $previous The previous exception used for the exception chaining.
   * @access public
   */
  public function __construct( $action, $context, $previous = NULL )
  {
    $message = 'Unknown action denied';
    if( is_string( $action ) )
    {
      $message = sprintf( '%s denied', $action );
    }
    else if( is_object( $action ) && is_a( $action, 'cenozo\database\service' ) )
    {
      $db_service = $action;
      $message = sprintf( 'service %s:%s denied', $db_service->method, $db_service->path );
    }

    parent::__construct( $message, $context, $previous );
  }
}

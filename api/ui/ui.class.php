<?php
/**
 * ui.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui;
use cenozo\lib, cenozo\log;

/**
 * Base class for all ui.
 *
 * All ui classes extend this base ui class.  All classes that extend this class are
 * used to fulfill some purpose executed by the user or machine interfaces.
 */
class ui extends \cenozo\base_object
{
  /**
   * Creates an HTML interface based on the current site and role.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function __construct()
  {
    // by default the UI does not use transactions
    lib::create( 'business\session' )->set_use_transaction( false );
  }

  /**
   * Returns the interface
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $error An associative array containing the error "title", "message" and "code", or
                         NULL if there is no error.
   * @return string
   * @access public
   */
  public function get_interface( $error = NULL )
  {
    $interface = '';
    if( is_null( $error ) )
    {
      // build the script
      ob_start();
      include( dirname( __FILE__ ).'/script.php' );
      $script = ob_get_clean();

      // build the body
      ob_start();
      include( dirname( __FILE__ ).'/body.php' );
      $body = ob_get_clean();

      ob_start();
      include( dirname( __FILE__ ).'/interface.php' );
      $interface = ob_get_clean();
    }
    else
    {
      $title = $error['title'];
      $message = $error['message'];
      $code = $error['code'];

      ob_start();
      include( dirname( __FILE__ ).'/error.php' );
      $interface = ob_get_clean();
    }

    return $interface;
  }
}

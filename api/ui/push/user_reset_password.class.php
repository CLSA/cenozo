<?php
/**
 * user_reset_password.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * Resets a user's password.
 * 
 * @package cenozo\ui
 */
class user_reset_password extends base_record
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The widget's subject.
   * @param array $args Push arguments
   * @throws exception\argument
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'user', 'reset_password', $args );
  }
  
  /**
   * Executes the push.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function finish()
  {
    $db_user = $this->get_record();
    $ldap_manager = lib::create( 'business\ldap_manager' );
    $ldap_manager->set_user_password( $db_user->name, 'password' );
  }
}
?>

<?php
/**
 * self_password.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\log, cenozo\util;

/**
 * widget self password
 * 
 * @package cenozo\ui
 */
class self_password extends \cenozo\ui\widget
{
  /**
   * Constructor
   * 
   * Defines all variables which need to be set for the associated template.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'self', 'password', $args );
    $this->show_heading( false );
  }

  /**
   * Finish setting the variables in a widget.
   * 
   * Defines all variables which need to be set for the associated template.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function finish()
  {
    parent::finish();
    
    // if the current password is "password" then mark the widget as the first password change
    $ldap_manager = util::create( 'business\ldap_manager' );
    $this->set_variable( 'first_password',
      $ldap_manager->validate_user( util::create( 'business\session' )->get_user()->name, 'password' ) );
  }
}
?>

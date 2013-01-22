<?php
/**
 * user_reset_password.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * Resets a user's password.
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
   * This method executes the operation's purpose.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    $user_class_name = lib::get_class_name( 'database\user' );

    $db_user = $this->get_record();
    $ldap_manager = lib::create( 'business\ldap_manager' );
    $ldap_manager->set_user_password( $db_user->name, 'password' );
    if( $user_class_name::column_exists( 'password' ) )
    {
      $db_user->password = $util_class_name::encrypt( 'password' );
      $db_user->save();
    }
  }
}
?>

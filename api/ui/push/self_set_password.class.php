<?php
/**
 * self_set_password.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: self set_password
 * 
 * Changes the current user's password.
 * Arguments must include 'password'.
 */
class self_set_password extends \cenozo\ui\push
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'self', 'set_password', $args );
  }
  
  /**
   * Validate the operation.  If validation fails this method will throw a notice exception.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    $util_class_name = lib::get_class_name( 'util' );
    $ldap_manager = lib::create( 'business\ldap_manager' );
    $db_user = lib::create( 'business\session' )->get_user();

    $old = $this->get_argument( 'old', 'password' );
    $new = $this->get_argument( 'new' );
    $confirm = $this->get_argument( 'confirm' );
    
    // make sure the old password is correct
    if( !$util_class_name::validate_user( $db_user->name, $old ) )
      throw lib::create( 'exception\notice',
        'The password you have provided is incorrect.', __METHOD__ );
    
    // make sure the new password isn't blank, at least 6 characters long and not "password"
    if( 6 > strlen( $new ) )
      throw lib::create( 'exception\notice',
        'Passwords must be at least 6 characters long.', __METHOD__ );
    else if( 'password' == $new )
      throw lib::create( 'exception\notice',
        'You cannot choose "password" as your password.', __METHOD__ );
    
    // and that the user confirmed their new password correctly
    if( $new != $confirm )
      throw lib::create( 'exception\notice',
        'The confirmed password does not match your new password.', __METHOD__ );
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

    $util_class_name = lib::get_class_name( 'util' );
    $user_class_name = lib::get_class_name( 'database\user' );
  
    $ldap_manager = lib::create( 'business\ldap_manager' );
    $db_user = lib::create( 'business\session' )->get_user();
    $new = $this->get_argument( 'new' );

    $ldap_manager->set_user_password( $db_user->name, $new );
    if( $user_class_name::column_exists( 'password' ) )
    {
      $db_user->password = $util_class_name::encrypt( $new );
      $db_user->save();
    }
  }
}
?>

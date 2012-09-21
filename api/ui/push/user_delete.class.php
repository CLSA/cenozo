<?php
/**
 * user_delete.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: user delete
 */
class user_delete extends base_delete
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'user', $args );
  }

  /**
   * Validate the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    // warn the user to remove access before deleting user
    if( 0 < $this->get_record()->get_access_count() )
      throw lib::create( 'exception\notice',
        sprintf( 'User account "%s" cannot be deleted because it is still in use.',
                 $this->get_record()->name ),
        __METHOD__ );
  }

  /**
   * This method executes the operation's purpose.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    $name = $this->get_record()->name;

    parent::execute();

    // remove the user from ldap
    $ldap_manager = lib::create( 'business\ldap_manager' );
    try
    {
      $ldap_manager->delete_user( $name );
    }
    catch( \cenozo\exception\ldap $e )
    {
      // catch user not found exceptions, no need to report them
      if( !$e->is_does_not_exist() ) throw $e;
    }
  }
}
?>

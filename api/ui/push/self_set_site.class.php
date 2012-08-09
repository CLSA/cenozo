<?php
/**
 * self_set_site.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: self set_site
 *
 * Changes the current user's site.
 * Arguments must include 'site'.
 */
class self_set_site extends \cenozo\ui\push
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'self', 'set_site', $args );
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

    $db_site = lib::create( 'database\site', $this->get_argument( 'id' ) );
    $db_user = lib::create( 'business\session' )->get_user();

    $role_mod = lib::create( 'database\modifier' );
    $role_mod->where( 'site_id', '=', $db_site->id );
    $role_list = $db_user->get_role_list( $role_mod );
    if( 0 == count( $role_list ) )
      throw lib::create( 'exception\runtime',
        'User does not have access to the given site.',  __METHOD__ );
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

    $session = lib::create( 'business\session' );
    $db_site = lib::create( 'database\site', $this->get_argument( 'id' ) );
    $db_user = $session->get_user();
    $db_role = NULL;

    // try loading the same role as the last time this site was accessed
    $activity_mod = lib::create( 'database\modifier' );
    $activity_mod->where( 'user_id', '=', $db_user->id );
    $activity_mod->where( 'site_id', '=', $db_site->id );
    $activity_mod->order_desc( 'datetime' );
    $activity_mod->limit( 1 );
    $activity_class_name = lib::get_class_name( 'database\activity' );
    $db_activity = current( $activity_class_name::select( $activity_mod ) );
    if( $db_activity )
    {
      // make sure the user still has access to the site/role
      $role_mod = lib::create( 'database\modifier' );
      $role_mod->where( 'site_id', '=', $db_activity->site_id );
      $role_mod->where( 'role_id', '=', $db_activity->role_id );
      $db_role = current( $db_user->get_role_list( $role_mod ) );
    }
    
    // if we don't have a role then get the first role associated with the site
    $role_mod = lib::create( 'database\modifier' );
    $role_mod->where( 'site_id', '=', $db_site->id );
    $role_list = $db_user->get_role_list( $role_mod );
    if( !$db_role ) $db_role = current( $role_list );

    $session->set_site_and_role( $db_site, $db_role );
  }
}
?>

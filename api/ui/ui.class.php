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
    $site_class_name = lib::get_class_name( 'database\site' );
    $role_class_name = lib::get_class_name( 'database\role' );

    $setting_manager = lib::create( 'business\setting_manager' );
    $session = lib::create( 'business\session' );
    $db_user = $session->get_user();
    $db_site = $session->get_site();

    $interface = '';
    if( is_null( $error ) )
    {
      // build the script
      ob_start();
      include( dirname( __FILE__ ).'/script.php' );
      $script = ob_get_clean();

      // build the body
      $version = $setting_manager->get_setting( 'general', 'version' );
      $site_name = $session->get_site()->name;
      $role_name = $session->get_role()->name;

      $site_list = array();
      $site_mod = lib::create( 'database\modifier' );
      $site_mod->join( 'access', 'site.id', 'access.site_id' );
      $site_mod->where( 'access.user_id', '=', $db_user->id );
      $site_mod->order( 'site.name' );
      $sites = array();
      foreach( $site_class_name::arrayselect( $site_mod ) as $site )
        $site_list[ $site['id'] ] = $site['name'];
  
      $role_mod = lib::create( 'database\modifier' );
      $role_mod->join( 'access', 'role.id', 'access.role_id' );
      $role_mod->where( 'access.user_id', '=', $db_user->id );
      $role_mod->order( 'role.name' );
      $role_list = array();
      foreach( $role_class_name::arrayselect( $role_mod ) as $role )
        $role_list[ $role['id'] ] = $role['name'];

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

<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\user;
use cenozo\lib, cenozo\log;

/**
 * Special service for handling the patch meta-resource
 */
class patch extends \cenozo\service\patch
{
  /**
   * Override parent method
   */
  protected function prepare()
  {
    $this->extract_parameter_list[] = 'password';

    parent::prepare();
  }

  /**
   * Override parent method
   */
  protected function validate()
  {
    parent::validate();

    if( $this->may_continue() )
    {
      $session = lib::create( 'business\session' );
      $db_site = $session->get_site();
      $db_role = $session->get_role();
      $db_user = $this->get_leaf_record();

      // only allow all-site users to edit users who do not have access to their current site
      $access_mod = lib::create( 'database\modifier' );
      $access_mod->where( 'site_id', '=', $db_site->id );
      if( !$db_role->all_sites && 0 == $db_user->get_access_count( $access_mod ) )
      {
        $this->status->set_code( 403 );
      }
      else
      {
        // don't allow roles to edit users with roles in a higher tier
        $access_sel = lib::create( 'database\select' );
        $access_sel->add_column( 'MAX( role.tier )', 'max_tier', false );
        $access_mod = lib::create( 'database\modifier' );
        $access_mod->join( 'role', 'access.role_id', 'role.id' );
        $access_mod->where( 'access.user_id', '=', $db_user->id );
        $access = current( $db_user->get_access_list( $access_sel, $access_mod ) );
        if( !$access || $access['max_tier'] > $db_role->tier )
        {
          $this->status->set_code( 403 );
        }
      }
    }
  }

  /**
   * Override parent method
   */
  protected function execute()
  {
    $util_class_name = lib::get_class_name( 'util' );
    $user_class_name = lib::get_class_name( 'database\user' );

    parent::execute();

    $db_user = $this->get_leaf_record();

    // process the preferred site, if it exists
    if( $this->get_argument( 'password', false ) )
    {
      $session = lib::create( 'business\session' );
      $setting_manager = lib::create( 'business\setting_manager' );
      $ldap_manager = lib::create( 'business\ldap_manager' );

      $default_password = $setting_manager->get_setting( 'general', 'default_password' );
      $ldap_manager->set_user_password( $db_user->name, $default_password );

      $db_user->password = $default_password; // hashed in database\user
      $db_user->save();

      // just incase the user is resetting their own password
      if( $session->get_user()->id == $db_user->id ) $session->set_no_password( $default_password );
    }

    $patch_array = parent::get_file_as_array();
    if( array_key_exists( 'active', $patch_array ) && $patch_array['active'] )
    {
      // when activating a user reset their login failures to 0
      $db_user->login_failures = 0;
      $db_user->save();
    }
  }
}

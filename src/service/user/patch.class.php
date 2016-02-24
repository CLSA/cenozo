<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
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
  public function get_file_as_array()
  {
    // remove password from the patch array
    $patch_array = parent::get_file_as_array();
    if( array_key_exists( 'password', $patch_array ) )
    {
      $this->update_password = true;
      unset( $patch_array['password'] );
    }

    return $patch_array;
  }

  /**
   * Override parent method
   */
  protected function execute()
  {
    parent::execute();

    // process the preferred site, if it exists
    if( $this->update_password )
    {
      $session = lib::create( 'business\session' );
      $setting_manager = lib::create( 'business\setting_manager' );

      $db_user = $this->get_leaf_record();
      $default_password = $setting_manager->get_setting( 'general', 'default_password' );
      $ldap_manager = lib::create( 'business\ldap_manager' );
      $ldap_manager->set_user_password( $db_user->name, $default_password );

      // just incase the user is resetting their own password
      if( $session->get_user()->id == $db_user->id ) $session->set_no_password( $default_password );
    }
  }

  /**
   * Whether to update the user's preferred site
   * @var boolean
   * @access protected
   */
  protected $update_password = false;
}

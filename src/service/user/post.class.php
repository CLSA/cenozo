<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\user;
use cenozo\lib, cenozo\log;

/**
 * The base class of all post services.
 */
class post extends \cenozo\service\post
{
  /**
   * Extends parent method
   */
  protected function execute()
  {
    $util_class_name = lib::get_class_name( 'util' );

    parent::execute();

    $setting_manager = lib::create( 'business\setting_manager' );

    if( $this->may_continue() )
    {
      $db_user = $this->get_leaf_record();

      $post_object = $this->get_file_as_object();
      if( property_exists( $post_object, 'site_id' ) && property_exists( $post_object, 'role_id' ) )
      {
        // add the initial access record
        $db_access = lib::create( 'database\access' );
        $db_access->user_id = $db_user->id;
        $db_access->site_id = $post_object->site_id;
        $db_access->role_id = $post_object->role_id;
        $db_access->save();
      }

      if( property_exists( $post_object, 'language_id' ) )
      {
        // add the language restriction to the user
        $db_user->add_language( $post_object->language_id );
      }

      // add the user to ldap
      $default_password = $setting_manager->get_setting( 'general', 'default_password' );
      $db_user->password = $default_password; // hashed in database\user
      $db_user->save();

      $ldap_manager = lib::create( 'business\ldap_manager' );
      try
      {
        $ldap_manager->new_user( $db_user->name, $db_user->first_name, $db_user->last_name, $default_password );
      }
      catch( \cenozo\exception\ldap $e )
      {
        // catch already exists exceptions, no need to report them
        if( !$e->is_already_exists() ) throw $e;
      }
    }
  }
}

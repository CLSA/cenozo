<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
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
    parent::execute();

    if( 300 > $this->status->get_code() )
    {
      $db_user = $this->get_leaf_record();

      $post_object = $this->get_object_as_object();
      if( property_exists( $post_object, 'site_id' ) && property_exists( $post_object, 'role_id' ) )
      {
        // add the initial access record
        $db_access = lib::create( 'database\access' );
        $db_access->user_id = $db_user->id;
        $db_access->site_id = $post_object->site_id;
        $db_access->role_id = $post_object->role_id;
        $db_access->save();
      }

      // add the user to ldap
      $ldap_manager = lib::create( 'business\ldap_manager' );
      try
      {
        $ldap_manager->new_user( $db_user->name, $db_user->first_name, $db_user->last_name, 'password' );
      }
      catch( \cenozo\exception\ldap $e )
      {
        // catch already exists exceptions, no need to report them
        if( !$e->is_already_exists() ) throw $e;
      }
    }
  }
}

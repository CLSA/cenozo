<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\self;
use cenozo\lib, cenozo\log;

/**
 * Special service for handling the patch meta-resource
 */
class patch extends \cenozo\service\service
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $path The URL of the service (not including the base)
   * @param array $args An associative array of arguments to be processed by the patch operation.
   * @param string $file The raw file posted by the request
   * @access public
   */
  public function __construct( $path, $args, $file )
  {
    parent::__construct( 'PATCH', $path, $args, $file );
  }

  /**
   * Override parent method since self is a meta-resource
   */
  protected function create_resource( $index )
  {
    $session = lib::create( 'business\session' );

    $pseudo_record = array(
      'application' => $session->get_application()->get_column_values(),
      'user' => $session->get_user()->get_column_values(),
      'site' => $session->get_site()->get_column_values(),
      'role' => $session->get_role()->get_column_values() );

    return $pseudo_record;
  }

  /**
   * Override parent method since self is a meta-resource
   */
  protected function execute()
  {
    $util_class_name = lib::get_class_name( 'util' );
    $user_class_name = lib::get_class_name( 'database\user' );
    $site_class_name = lib::get_class_name( 'database\site' );
    $role_class_name = lib::get_class_name( 'database\role' );

    $session = lib::create( 'business\session' );
    $setting_manager = lib::create( 'business\setting_manager' );
    $patch_array = $this->get_file_as_array();

    // make sure to only allow editing of user OR site+role
    if( 1 == count( $patch_array ) && array_key_exists( 'user', $patch_array ) )
    {
      $db_user = $session->get_user();
      $user_array = (array) $patch_array['user'];

      if( 1 == count( $user_array ) && array_key_exists( 'password', $user_array ) )
      { // changing password
        $password = $user_array['password'];
        if( !property_exists( $password, 'current' ) || !property_exists( $password, 'requested' ) )
        {
          $this->status->set_code( 400 );
        }
        else
        {
          // use the default password if the current is null
          if( is_null( $password->current ) )
            $password->current = $setting_manager->get_setting( 'general', 'default_password' );

          // validate the user's current password (don't increment failure count)
          if( !$util_class_name::validate_user( $db_user->name, $password->current, false ) )
          {
            $this->set_data( 'invalid password' );
            $this->status->set_code( 400 );
          }
          else
          {
            $ldap_manager = lib::create( 'business\ldap_manager' );
            $ldap_manager->set_user_password( $db_user->name, $password->requested );
            if( $user_class_name::column_exists( 'password' ) )
            {
              $db_user->password = $util_class_name::encrypt( $password->requested );
              $db_user->save();
            }
            $session->set_no_password( $password->requested );
          }
        }
      }
      else
      { // modifying current user's record
        $modified = false;
        foreach( $user_array as $column => $value )
        {
          if( !in_array( $column, array( 'first_name', 'last_name', 'email', 'timezone', 'use_12hour_clock' ) ) )
          {
            $modified = false;
            $this->status->set_code( 400 );
          }
          else
          {
            $modified = true;
            $db_user->$column = $value;
          }
        }

        try
        {
          if( $modified ) $db_user->save();
        }
        catch( \cenozo\exception\database $e )
        {
          if( $e->is_duplicate_entry() )
          {
            $this->set_data( $e->get_duplicate_columns( $db_user->get_class_name() ) );
            $this->status->set_code( 409 );
          }
          else
          {
            $this->status->set_code( $e->is_missing_data() ? 400 : 500 );
            throw $e;
          }
        }
      }
    }
    else
    {
      $has_site = array_key_exists( 'site', $patch_array );
      $has_role = array_key_exists( 'role', $patch_array );

      if( ( 1 == count( $patch_array ) && ( $has_site || $has_role ) ) ||
          ( 2 == count( $patch_array ) && $has_site && $has_role ) )
      {
        // determine if the site is changing or not
        $db_requested_site = $session->get_site();
        if( $has_site )
        {
          $site_array = (array) $patch_array['site'];
          $db_requested_site =
            $site_class_name::get_unique_record( array_keys( $site_array ), array_values( $site_array ) );
        }

        // determine if the role is changing or not
        $db_requested_role = $session->get_role();
        if( $has_role )
        {
          $role_array = (array) $patch_array['role'];
          $db_requested_role =
            $role_class_name::get_unique_record( array_keys( $role_array ), array_values( $role_array ) );
        }

        $success = $session->login( NULL, $db_requested_site, $db_requested_role );
        $session->mark_access_time();
        $this->status->set_code( $success ? 204 : 403 );
      }
      else
      {
        $this->status->set_code( 400 );
        throw lib::create( 'exception\runtime',
          sprintf( 'Patch expects a user OR a site and/or role, got "%s"', implode( ', ', $patch_array ) ),
          __METHOD__ );
      }
    }
  }
}

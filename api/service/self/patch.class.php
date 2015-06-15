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
  public function get_resource( $index )
  {
    $util_class_name = lib::get_class_name( 'util' );
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
    $user_class_name = lib::get_class_name( 'database/user' );
    $session = lib::create( 'business\session' );

    $data = $this->get_file_as_object();
    foreach( get_object_vars( $data ) as $key => $object )
    {
      if( is_object( $object ) )
      {
        $array = (array) $object;
        $column = key( $array );
        $value = current( $array );
        if( 'user' == $key )
        {
          $db_user = $session->get_user();

          if( in_array( $column, array( 'first_name', 'last_name', 'email', 'timezone' ) ) )
          {
            $db_user->$column = $value;

            try
            {
              $db_user->save();
            }
            catch( \cenozo\exception\database $e )
            {
              if( $e->is_duplicate_entry() )
              {
                $this->data = $e->get_duplicate_columns( $db_user->get_class_name() );
                $this->status->set_code( 409 );
              }
              else
              {
                $this->status->set_code( $e->is_missing_data() ? 400 : 500 );
                throw $e;
              }
            }
          }
          else if( 'break' == $column )
          {
            if( $value )
            { // close the current activity
              $activity_mod = lib::create( 'database\modifier' );
              $activity_mod->where( 'user_id', '=', $db_user->id );
              $activity_mod->where( 'site_id', '=', $session->get_site()->id );
              $activity_mod->where( 'role_id', '=', $session->get_role()->id );
              $activity_mod->where( 'end_datetime', '=', NULL );
              $activity_list = $db_user->get_activity_object_list( $activity_mod );
              foreach( $activity_list as $db_activity )
              {
                $db_activity = current( $activity_list );
                $db_activity->end_datetime = $util_class_name::get_datetime_object();
                $db_activity->save();
              }
            }
          }
          else if( 'password' == $column )
          {
            $password = $object->password;
            if( !property_exists( $password, 'current' ) || !property_exists( $password, 'requested' ) )
            {
              $this->status->set_code( 400 );
            }
            else
            {
              // validate the user's current password
              if( !$util_class_name::validate_user( $db_user->name, $password->current ) )
              {
                $this->status->set_code( 401 );
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
              }
            }
          }
        }
        else if( 'site' == $key || 'role' == $key )
        {
          $site_class_name = lib::get_class_name( 'database\site' );
          $role_class_name = lib::get_class_name( 'database\role' );

          $db_site = 'site' == $key
                   ? $site_class_name::get_unique_record( $column, $value )
                   : NULL;
          $db_role = 'role' == $key
                   ? $role_class_name::get_unique_record( $column, $value )
                   : NULL;

          $success = false;
          if( !is_null( $db_site ) || !is_null( $db_role ) )
          {
            $success = $session->set_site_and_role( $db_site, $db_role );
            $session->mark_access_time();
          }

          $this->status->set_code( $success ? 204 : 403 );
        }
      }
      else
      {
        $this->status->set_code( 400 );
        throw lib::create( 'exception\runtime',
          'Patch expecting an object, got '.gettype( $object ),
          __METHOD__ );
      }
    }
  }
}

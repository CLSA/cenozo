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

    // add timezone information to help poor featureless javascript
    $datetime_obj = $util_class_name::get_datetime_object();
    $pseudo_record['site']['timezoneName'] = $datetime_obj->format( 'T' );
    $pseudo_record['site']['timezoneOffset'] =
      $util_class_name::get_timezone_object()->getOffset( $datetime_obj );

    return $pseudo_record;
  }

  /**
   * Override parent method since self is a meta-resource
   */
  protected function execute()
  {
    $session = lib::create( 'business\session' );
    $object = $this->get_file_as_object();
    foreach( get_object_vars( $object ) as $key => $value )
    {
      if( is_object( $value ) )
      {
        $value = (array) $value;
        $column = key( $value );
        $value = current( $value );
        if( 'user' == $key )
        {
          if( in_array( $column, array( 'first_name', 'last_name', 'email' ) ) )
          {
            $db_user = $session->get_user();
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
              else if( $e->is_missing_data() ) $this->status->set_code( 400 );
              else throw $e;
            }
          }
          else if( 'password' == $column )
          {
            // TODO: edit password
          }
        }
        else if( 'site' == $key || 'role' == $key )
        {
          if( is_object( $value ) )
          {
            $value = (array) $value;
            $site_class_name = lib::get_class_name( 'database\site' );
            $role_class_name = lib::get_class_name( 'database\role' );

            $db_site = 'site' == $value
                     ? $site_class_name::get_unique_record( $column, $value )
                     : NULL;
            $db_role = 'role' == $value
                     ? $role_class_name::get_unique_record( $column, $value )
                     : NULL;

            $success = false;
            if( !is_null( $db_site ) || !is_null( $db_role ) )
              $success = $session->set_site_and_role( $db_site, $db_role );

            $this->status->set_code( $success ? 204 : 403 );
          }
        }
      }
      else
      {
        $this->status->set_code( 400 );
      }
    }
  }
}

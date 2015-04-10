<?php
/**
 * service.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * Base class for all service.
 *
 * All service classes extend this base service class.  All classes that extend this class are
 * used to fulfill some purpose executed by the user or machine interfaces.
 */
abstract class service extends \cenozo\base_object
{
  /**
   * Returns the associated database service for the provided service.
   * 
   * In addition to constructing the service object, the service is also validated against the
   * user's current role's access.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $method The request's method (DELETE, GET, HEAD, PATCH, POST, PUT)
   * @param string $path The URL of the service (not including the base)
   * @param array $args An associative array of arguments included in the request
   * @param string $file The raw file posted by PATCH, POST and PUT requests
   * @access public
   */
  public function __construct( $method, $path, $args = NULL, $file = NULL )
  {
    // by default all services use transactions
    $session = lib::create( 'business\session' );
    $session->set_use_transaction( true );

    if( 0 < strlen( $path ) )
    {
      $this->process_path( $path );

      // build the service record
      // path needs to have all resources replaced with <id>
      $path_for_record = '';

      foreach( $this->collection_name_list as $index => $collection )
      {
        $path_for_record .= sprintf( '/%s', $this->collection_name_list[$index] );
        if( array_key_exists( $index, $this->resource_value_list ) ) $path_for_record .= '/<id>';
      }

      // trim off the first /
      $path_for_record = substr( $path_for_record, 1 );

      $service_class_name = lib::get_class_name( 'database\service' );
      $this->service_record =
        $service_class_name::get_unique_record(
          array( 'method', 'path' ),
          array( $method, $path_for_record ) );
    }

    $this->arguments = $args;
    $this->file = $file;

    if( !is_null( $this->service_record ) && 
        in_array( $this->service_record->method, array( 'DELETE', 'PATCH', 'POST', 'PUT' ) ) )
    {
      $util_class_name = lib::get_class_name( 'util' );
      $this->db_writelog = lib::create( 'database\writelog' );
      $this->db_writelog->user_id = $session->get_user()->id;
      $this->db_writelog->site_id = $session->get_site()->id;
      $this->db_writelog->role_id = $session->get_role()->id;
      $this->db_writelog->service_id = $this->service_record->id;
      $this->db_writelog->path = $path;
      $this->db_writelog->datetime = $util_class_name::get_datetime_object()->format( 'Y-m-d H:i:s' );
      $this->db_writelog->save();
    }
  }

  /**
   * Processes the service by doing the following stages:
   * 1. prepare:  processes arguments, preparing them for the service
   * 2. validate: checks to make sure the arguments are valid, the user has access, etc
   * 3. setup:    a pre-execution phase that sets up the service
   * 4. execute:  execution of the service, completing the task
   * 5. finish:   a post-execution phase that finishes extra tasks after execution
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function process()
  {
    $util_class_name = lib::get_class_name( 'util' );

    if( self::$debug ) $time['begin'] = $util_class_name::get_elapsed_time();

    $this->prepare();
    if( self::$debug ) $time['prepare'] = $util_class_name::get_elapsed_time();

    if( 300 <= $this->status->get_code() ) return;
    $this->validate();
    if( self::$debug ) $time['validate'] = $util_class_name::get_elapsed_time();

    if( 300 <= $this->status->get_code() ) return;
    $this->setup();
    if( self::$debug ) $time['setup'] = $util_class_name::get_elapsed_time();

    if( 300 <= $this->status->get_code() ) return;
    $this->execute();
    if( self::$debug ) $time['execute'] = $util_class_name::get_elapsed_time();

    if( 300 <= $this->status->get_code() ) return;
    $this->finish();
    if( self::$debug ) $time['finish'] = $util_class_name::get_elapsed_time();

    if( self::$debug )
    {
      log::debug( sprintf( '[%s] %s times: (%s) => (%s)',
                           strtoupper( $this->service_record->method ),
                           $this->service_record->path,
                           implode( ', ', array_keys( $time ) ),
                           implode( ', ', array_values( $time ) ) ) );
    }
  }

  /**
   * Processes arguments, preparing them for the service.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function prepare()
  {
    // make sure the service record exists
    $this->status = lib::create( 'service\status', is_object( $this->service_record ) ? 200 : 404 );

    // go through all collection/resource pairs
    foreach( $this->collection_name_list as $index => $collection_name )
    {
      if( array_key_exists( $index, $this->resource_value_list ) )
      {
        $record = $this->get_resource( $index );

        if( is_null( $record ) )
        {
          $this->status->set_code( 404 );
          break;
        }
        else
        {
          // ensure that this resource belongs to the parent record (if there is one)
          if( 0 < $index )
          {
            // get the parent record and test to see if this record is one of its children
            $parent_record = $this->get_resource( $index - 1 );
            $method_name = sprintf( 'get_%s_count', $collection_name );
            $modifier = lib::create( 'database\modifier' );
            $modifier->where( sprintf( '%s.id', $record::get_table_name() ), '=', $record->id );
            if( 0 == $parent_record->$method_name( $modifier ) )
            {
              $this->status->set_code( 404 );
              break;
            }
          }
        }
      }
    }
  }

  /**
   * Validate the service.  If validation fails the service's return status will be set to 403
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function validate()
  {
    if( $this->validate_access )
    {
      // return a status of 403 if the service isn't allowed
      if( !lib::create( 'business\session' )->is_service_allowed( $this->service_record ) )
        $this->status = lib::create( 'service\status', 403 );
    }
  }

  /**
   * Sets up the service with any pre-execution instructions that may be necessary.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup() {}

  /**
   * This method executes the service's purpose.  All services must implement this method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute() {}

  /**
   * Finishes the service with any post-execution instructions that may be necessary.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function finish() {}

  /**
   * Closes the writelog created by the service by adding the elapsed time and status
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function close_writelog()
  {
    if( !is_null( $this->db_writelog ) )
    {
      $util_class_name = lib::get_class_name( 'util' );
      $this->db_writelog->elapsed = $util_class_name::get_elapsed_time();
      $this->db_writelog->status = $this->status->get_code();
      $this->db_writelog->save();
    }
  }

  /**
   * Converts the service's path into a a list of collection and resource names
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $path
   * @access protected
   */
  protected function process_path( $path )
  {
    $this->collection_name_list = array();
    $this->resource_value_list = array();

    foreach( explode( '/', $path ) as $index => $part )
    {
      if( 0 == $index % 2 ) $this->collection_name_list[] = $part;
      else $this->resource_value_list[] = $part;
    }
  }

  /**
   * Returns the resource for a particular index
   * 
   * The index is based on the service's path.  Every other item in the path identifies a
   * resource either by ID or some other set of key/value pair(s).  For instance, for the
   * path /collection/1/participant/2 the first resource would be a collection for ID 1
   * and the second a participant for ID 2.  Null is returned if there is no resource for
   * the given index.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param integer $index
   * @return database\record
   * @access protected
   */
  protected function get_resource( $index )
  {
    if( !array_key_exists( $index, $this->resource_cache ) )
    {
      $session = lib::create( 'business\session' );

      $record = NULL;

      if( array_key_exists( $index, $this->collection_name_list ) &&
          array_key_exists( $index, $this->resource_value_list ) )
      {
        $collection_name = $this->collection_name_list[$index];
        $resource_value = $this->resource_value_list[$index];

        $util_class_name = lib::get_class_name( 'util' );
        $record_class_name = lib::get_class_name( sprintf( 'database\%s', $collection_name ) );

        if( $util_class_name::string_matches_int( $resource_value ) )
        { // there is a resource, get the corresponding record
          try
          {
            $record = new $record_class_name( $resource_value );
          }
          // ignore runtime exceptions and instead just return a null record
          catch( \cenozo\exception\runtime $e ) {}
        }
        else if( false !== strpos( $resource_value, '=' ) )
        { // check unique keys
          $columns = array();
          $values = array();
          foreach( explode( ';', $resource_value ) as $part )
          {
            $pair = explode( '=', $part );
            if( 2 == count( $pair ) )
            {
              $columns[] = $pair[0];
              $values[] = $pair[1];
            }
          }

          if( 0 < count( $columns ) )
          {
            $parent_index = $index - 1;
            if( 0 <= $parent_index )
            {
              // add the parent ID to the unique key
              $parent_record = $this->get_resource( $parent_index );
              $columns[] = sprintf( '%s_id', $parent_record->get_class_name() );
              $values[] = $parent_record->id;
            }
            
            $record = $record_class_name::get_unique_record( $columns, $values );
          }
        }

        // restrict some roles when resource is related to a site
        if( !$session->get_role()->all_sites )
        {
          $db_site = $session->get_site();
          if( 'site' == $collection_name )
          {
            if( $db_site->id != $record->id ) $this->status->set_code( 403 );
          }
          else
          {
            if( $record_class_name::column_exists( 'site_id' ) && $record->site_id != $db_site->id )
              $this->status->set_code( 403 );
          }
        }
      }

      $this->resource_cache[$index] = $record;
    }

    return $this->resource_cache[$index];
  }

  /**
   * Returns the subject of the second-to-last collection (based on the service's path)
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string If there is no parent subject then NULL is returned
   * @access protected
   */
  protected function get_parent_subject()
  {
    $count = count( $this->collection_name_list );
    return 1 < $count ? $this->collection_name_list[$count - 2] : NULL;
  }

  /**
   * Returns the resource of the second-to-last collection (based on the service's path)
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string If there is no parent subject then NULL is returned
   * @access protected
   */
  protected function get_parent_record()
  {
    $count = count( $this->collection_name_list );
    return 1 < $count ? $this->get_resource( $count - 2 ) : NULL;
  }

  /**
   * Returns the subject of the last collection (based on the service's path)
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string If there is no leaf subject then NULL is returned
   * @access protected
   */
  protected function get_leaf_subject()
  {
    $count = count( $this->collection_name_list );
    return 0 < $count ? $this->collection_name_list[$count - 1] : NULL;
  }

  /**
   * Returns the resource of the last collection (based on the service's path)
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string If there is no leaf subject then NULL is returned
   * @access protected
   */
  protected function get_leaf_record()
  {
    $count = count( $this->collection_name_list );
    return 0 < $count ? $this->get_resource( $count - 1 ) : NULL;
  }

  /**
   * Returns the file provided to the service decoded as a JSON string
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function get_file_as_object()
  {
    $util_class_name = lib::get_class_name( 'util' );
    return $util_class_name::json_decode( $this->file );
  }

  /**
   * Returns the file provided to the service (unchanged)
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function get_file_as_raw()
  {
    return $this->file;
  }

  /**
   * Get a query argument passed to the service.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $name The name of the argument.
   * @param mixed $default The value to return if no argument exists.  If the default is null then
   *                       it is assumed that the argument must exist, throwing an argument
                           exception if it is not set.
   * @return mixed
   * @throws exception\argument
   * @access protected
   */
  protected function get_argument( $name, $default = NULL )
  {
    $argument = NULL;
    if( !array_key_exists( $name, $this->arguments ) )
    {
      if( 1 == func_num_args() )
      {
        $this->status->set_code( 400 );
        throw lib::create( 'exception\argument', $name, NULL, __METHOD__ );
      }
      $argument = $default;
    }
    else
    { // the argument exists
      $argument = $this->arguments[$name];
    }

    return $argument;
  }

  /**
   * Returns the http status
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return service\status
   * @access public
   */
  public function get_status() { return $this->status; }

  /**
   * Returns any headers generated by the service.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array( mixed )
   * @access public
   */
  public function get_headers() { return $this->headers; }

  /**
   * Returns any data generated by the service.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return mixed
   * @access public
   */
  public function get_data() { return $this->data; }

  /**
   * Gets whether to check if the user has access to the service
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access protected
   */
  protected function get_validate_access()
  {
    return $this->validate_access;
  }

  /**
   * Sets whether to check if the user has access to the service
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $access
   * @access protected
   */
  protected function set_validate_access( $access )
  {
    $this->validate_access = $access;
  }

  /**
   * When set to true all service processes will report elapsed times to the debug log
   * @var boolean
   * @static
   * @access public
   */
  public static $debug = false;

  /**
   * The status object returned in response to the service request
   * @var service\status
   * @access protected
   */
  protected $status = NULL;

  /**
   * The url query arguments.
   * @var array( array )
   * @access private
   */
  private $arguments = array();

  /**
   * The url query arguments.
   * @var array( array )
   * @access private
   */
  private $file = NULL;

  /**
   * The writelog record associated with the service request (null for read-only services)
   * @var database\writelog
   * @access protected
   */
  protected $db_writelog = NULL;

  /**
   * Header data generated by the service (if any).
   * @var array( mixed )
   * @access protected
   */
  protected $headers = array();

  /**
   * Data generated by the service (if any).
   * @var mixed
   * @access protected
   */
  protected $data = NULL;
  
  /**
   * A list of all collection names based on the service's path
   * @var array( string )
   * @access protected
   */
  protected $collection_name_list = NULL;

  /**
   * A list of all resource lookup values based on the service's path (may be an id or some other
   * set of key/value pair(s)
   * @var array( string )
   * @access protected
   */
  protected $resource_value_list = NULL;

  /**
   * 
   * @var array( database\record )
   * @access private
   */
  private $resource_cache = array();

  /**
   * The database record for this service
   * @var database\service
   * @access protected
   */
  protected $service_record = NULL;

  /**
   * Whether to check if the user's access has permission to perform this service
   * @var boolean
   * @access private
   */
  private $validate_access = true;
}

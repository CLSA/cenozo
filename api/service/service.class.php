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
   * user's current role's access.  If the service is not permitted a permission exception is
   * thrown.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $method The request's method (DELETE, GET, PATCH, POST, PUSH)
   * @param string $subject The subject of the service
   * @param string $resource The resource referenced by the request
   * @param array $args An associative array of arguments included in the request
   * @access public
   */
  public function __construct( $method, $subject, $resource = NULL, $args = NULL )
  {
    // by default all services use transactions
    lib::create( 'business\session' )->set_use_transaction( true );

    // build the service record
    $service_class_name = lib::get_class_name( 'database\service' );
    $this->service_record =
      $service_class_name::get_unique_record(
        array( 'method', 'subject', 'resource' ),
        array( $method, $subject, !is_null( $resource ) ) );
    
    $this->resource = $resource;
    $this->arguments = $args;
    $this->status = NULL;
    $this->data = NULL;
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

    if( !is_object( $this->service_record ) )
    {
      $this->status = lib::create( 'service\status', 404 );
      throw lib::create( 'exception\runtime', 'Request path is not found.', __METHOD__ );
    }
    else
    {
      $this->status = lib::create( 'service\status', 200 );
    }

    if( self::$debug ) $time['begin'] = $util_class_name::get_elapsed_time();

    $this->prepare();
    if( self::$debug ) $time['prepare'] = $util_class_name::get_elapsed_time();

    $this->validate();
    if( self::$debug ) $time['validate'] = $util_class_name::get_elapsed_time();
    
    $this->setup();
    if( self::$debug ) $time['setup'] = $util_class_name::get_elapsed_time();
    
    $this->execute();
    if( self::$debug ) $time['execute'] = $util_class_name::get_elapsed_time();
    
    $this->finish();
    if( self::$debug ) $time['finish'] = $util_class_name::get_elapsed_time();

    if( self::$debug )
    {
      log::debug( sprintf( '[%s] %s times: (%s) => (%s)',
                           strtoupper( $this->get_method() ),
                           $this->get_path(),
                           implode( ', ', array_keys( $time ) ),
                           implode( ', ', array_values( $time ) ) ) );
    }
  }

  /**
   * Processes arguments, preparing them for the service.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function prepare() {}

  /**
   * Validate the service.  If validation fails this method will throw a notice exception.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws excpetion\argument, exception\permission
   * @access protected
   */
  protected function validate()
  {
    if( $this->validate_access )
    {
      // throw a permission exception if the user is not allowed to perform this service
      if( !lib::create( 'business\session' )->is_service_allowed( $this->service_record ) )
      {
        $this->status = lib::create( 'service\status', 404 );
        throw lib::create( 'exception\runtime', 'Request path is not allowed.', __METHOD__ );
      }
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
   * Get the database id of the service.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return int
   * @access public
   */
  public function get_id() { return $this->service_record->id; }
  
  /**
   * Get the service's method.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_method() { return $this->service_record->method; }
  
  /**
   * Get the subject of service.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_subject() { return $this->service_record->subject; }
  
  /**
   * Get the full name of service (subject_name)
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_path()
  { return $this->service_record->subject.( !is_null( $this->resource ) ? '/'.$this->resource : '' ); }
 
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
   * @access public
   */
  public function get_argument( $name, $default = NULL )
  {
    $argument = NULL;
    if( !array_key_exists( $name, $this->arguments ) )
    {
      if( 1 == func_num_args() )
        throw lib::create( 'exception\argument', $name, NULL, __METHOD__ );
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
   * The database record for this service
   * @var database\record
   * @access protected
   */
  protected $service_record = NULL;

  /**
   * TODO: document
   */
  protected $status;

  /**
   * The url query resource.
   * @var string
   * @access protected
   */
  protected $resource = NULL;

  /**
   * The url query arguments.
   * @var array( array )
   * @access protected
   */
  protected $arguments = array();

  /**
   * Data generated by the service (if any).
   * @var mixed
   * @access protected
   */
  protected $data = NULL;

  /**
   * Whether to check if the user's access has permission to perform this service
   * @var boolean
   * @access private
   */
  private $validate_access = true;
}

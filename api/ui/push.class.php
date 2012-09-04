<?php
/**
 * push.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui;
use cenozo\lib, cenozo\log;

/**
 * The base class of all push operations
 */
abstract class push extends operation
{
  /**
   * Constructor
   * 
   * Defines all variables available in push operations
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The subject of the operation.
   * @param string $name The name of the operation.
   * @param array $args An associative array of arguments to be processed by the push operation.
   * @access public
   */
  public function __construct( $subject, $name, $args )
  {
    parent::__construct( 'push', $subject, $name, $args );

    // by default all push operations use transactions
    lib::create( 'business\session' )->set_use_transaction( true );
  }

  /**
   * Processes arguments, preparing them for the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @abstract
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();

    $this->arguments = $this->convert_from_noid( $this->arguments );
  }

  /**
   * Sets up the operation with any pre-execution instructions that may be necessary.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @abstract
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    if( !$this->machine_request_received && $this->machine_request_enabled )
      $this->machine_arguments = $this->convert_to_noid( $this->arguments );
  }

  /**
   * Finishes the operation with any post-execution instructions that may be necessary.
   * TODO: convert to protected
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function finish()
  {
    parent::finish();

    // if this operation was not received by machine then send a machine request
    if( !$this->machine_request_received && $this->machine_request_enabled )
      $this->send_machine_request();
  }

  /**
   * Converts primary keys to unique keys in operation arguments.
   * All converted arguments will appear in the array under a 'noid' key.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An argument list, usually those passed to the push operation.
   * @return array
   * @access protected
   */
  protected function convert_to_noid( $args )
  {
    foreach( $args as $arg_key => $arg_value )
    {
      if( 'columns' == $arg_key )
      { // columns array may contain foreign keys
        foreach( $arg_value as $column_name => $column_value )
        {
          if( '_id' == substr( $column_name, -3 ) )
          {
            $subject = substr( $column_name, 0, -3 );
            $class_name = lib::get_class_name( 'database\\'.$subject );
            $args['noid']['columns'][$subject] =
              $column_value ? $class_name::get_unique_from_primary_key( $column_value ) : NULL;
            unset( $args['columns'][$column_name] );
          }
        }
      }
      else if( 'id' == $arg_key || '_id' == substr( $arg_key, -3 ) )
      { // convert the primary key and foreign keys
        $column_name = $arg_key;
        $column_value = $arg_value;
        $subject = 'id' == $column_name ? $this->get_subject() : substr( $column_name, 0, -3 );
        $class_name = lib::get_class_name( 'database\\'.$subject );
        $args['noid'][$subject] =
          $column_value ? $class_name::get_unique_from_primary_key( $column_value ) : NULL;
        unset( $args[$column_name] );
      }
    }

    // If no keys need conversion we still want to make sure the noid array exists so that
    // the receiving service identifies the request as having come from a machine
    if( !array_key_exists( 'noid', $args ) ) $args['noid'] = array( NULL );

    return $args;
  }

  /**
   * Converts unique keys to primary keys in operation arguments.
   * All unique keys to be converted should be under a 'noid' key.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An argument list, usually those passed to the push operation.
   * @return array
   * @access protected
   */
  protected function convert_from_noid( $args )
  {
    if( array_key_exists( 'noid', $args ) )
    {
      $this->machine_request_received = true;
      
      // remove the noid argument
      $noid = $args['noid'];
      unset( $args['noid'] );
      if( !is_array( $noid ) )
        throw lib::create( 'exception\runtime', 'Argument noid must be an array.', __METHOD__ );

      foreach( $noid as $noid_key => $noid_value )
      {
        // ignore empty values
        if( $noid_value )
        {
          if( 'columns' === $noid_key )
          { // foreign key found in columns array
            foreach( $noid_value as $subject => $unique_key )
            {
              $class_name = lib::get_class_name( 'database\\'.$subject );
              $args['columns'][$subject.'_id'] = 
                $class_name::get_primary_from_unique_key( $unique_key );
            }
          }
          else // primary and foreign keys
          {
            $subject = $noid_key;
            $unique_key = $noid_value;
            $arg_key = $this->get_subject() == $subject ? 'id' : $subject.'_id';
            $class_name = lib::get_class_name( 'database\\'.$subject );
            $args[$arg_key] = 
              $class_name::get_primary_from_unique_key( $unique_key );
          }
        }
      }
    }

    return $args;
  }
      
  /**
   * Returns whether or not the operation is to send a machine request along with performing the
   * push locally.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function get_machine_request_enabled()
  {
    return $this->machine_request_enabled;
  }

  /**
   * Defines whether or not to send a machine request along with performing the push locally.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $enabled
   * @access public
   */
  public function set_machine_request_enabled( $enabled )
  {
    $this->machine_request_enabled = $enabled;
  }

  /**
   * Returns the url which the machine request is sent to.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_machine_request_url()
  {
    return $this->machine_request_url;
  }

  /**
   * Defines the url to send machine requests to.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $url
   * @access public
   */
  public function set_machine_request_url( $url )
  {
    $this->machine_request_url = $url;
  }

  /**
   * Sends a machine request.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An associative array of arguments to be sent.
   * @access protected
   */
  protected function send_machine_request()
  {
    $cenozo_manager = lib::create( 'business\cenozo_manager', $this->machine_request_url );
    $cenozo_manager->use_machine_credentials( $this->machine_credentials );
    $cenozo_manager->push( $this->get_subject(), $this->get_name(), $this->machine_arguments );
  }

  /**
   * Whether the push operation was received by a machine.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function get_machine_request_received()
  {
    return $this->machine_request_received;
  }

  /**
   * Returns the name of the application which sent the machine request.
   * This value is NULL if a machine request was not made and an empty string
   * if the application did not identify itself.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_machine_application_name()
  {
    $name = array_key_exists( 'HTTP_APPLICATION_NAME', $_SERVER )
          ? $_SERVER['HTTP_APPLICATION_NAME'] : '';
    return $this->machine_request_received ? $name : NULL;
  }

  /**
   * Whether to replace the user with machine credentials when sending machine requests.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $use
   * @access protected
   */
  protected function use_machine_credentials( $use )
  {
    $this->machine_credentials = (bool) $use;
  }

  /**
   * The url to send machine requests to.
   * @var string
   * @access private
   */
  private $machine_request_url = NULL;

  /**
   * Whether or not to send machine requests along with the local push operation.
   * @var boolean
   * @access private
   */
  private $machine_request_enabled = false;

  /**
   * Whether or not this operation was requested by a machine.
   * @var boolean
   * @access private
   */
  private $machine_request_received = false;

  /**
   * The arguments to send with a machine request.
   * @var array( array )
   * @access protected
   */
  protected $machine_arguments = array();

  /**
   * Whether to use the machine's credentials when sending a machine request
   * @var boolean
   * @access private
   */
  private $machine_credentials = false;
}
?>

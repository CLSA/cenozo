<?php
/**
 * operation.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui;
use cenozo\lib, cenozo\log;

/**
 * Base class for all operation.
 *
 * All operation classes extend this base operation class.  All classes that extend this class are
 * used to fulfill some purpose executed by the user or machine interfaces.
 */
abstract class operation extends \cenozo\base_object
{
  /**
   * Returns the associated database operation for the provided operation.
   * 
   * In addition to constructing the operation object, the operation is also validated against the
   * user's current role's access.  If the operation is not permitted a permission exception is
   * thrown.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $type The type of operation (either 'push', 'pull' or 'widget')
   * @param string $subject The subject of the operation.
   * @param string $name The name of the operation.
   * @param array $args An associative array of arguments to be processed by the widgel
   * @access public
   */
  public function __construct( $type, $subject, $name, $args )
  {
    // type must either be a pull, push or widget
    if( 'push' != $type && 'pull' != $type && 'widget' != $type )
      throw lib::create( 'exception\argument', 'type', $type, __METHOD__ );
    
    // build the operation record
    $operation_class_name = lib::get_class_name( 'database\operation' );
    $this->operation_record =
      $operation_class_name::get_operation( $type, $subject, $name );
    
    if( is_null( $this->operation_record ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Unable to create operation record for %s: %s_%s',
                 $type, $subject, $name ),
        __METHOD__ );

    // store the arguments
    if( is_array( $args ) ) $this->arguments = $args;
  }
  
  /**
   * Processes the operation by doing the following stages:
   * 1. prepare:  processes arguments, preparing them for the operation
   * 2. validate: checks to make sure the arguments are valid, the user has access, etc
   * 3. setup:    a pre-execution phase that sets up the operation
   * 4. execute:  execution of the operation, completing the task
   * 5. finish:   a post-execution phase that finishes extra tasks after execution
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function process()
  {
    $this->prepare();
    $this->validate();
    $this->setup();
    $this->execute();
    $this->finish();
  }

  /**
   * Processes arguments, preparing them for the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function prepare() {}

  /**
   * Validate the operation.  If validation fails this method will throw a notice exception.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws excpetion\argument, exception\permission
   * @access protected
   */
  protected function validate()
  {
    if( $this->validate_access )
    {
      // throw a permission exception if the user is not allowed to perform this operation
      if( !lib::create( 'business\session' )->is_allowed( $this->operation_record ) )
        throw lib::create( 'exception\permission', $this->operation_record, __METHOD__ );
    }
  }

  /**
   * Sets up the operation with any pre-execution instructions that may be necessary.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    if( is_null( $this->get_heading() ) )
      $this->set_heading( $this->get_subject().' '.$this->get_name() );
  }

  /**
   * This method executes the operation's purpose.  All operations must implement this method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute() {}

  /**
   * Finishes the operation with any post-execution instructions that may be necessary.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function finish() {}

  /**
   * Get the database id of the operation.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return int
   * @access public
   */
  public function get_id() { return $this->operation_record->id; }
  
  /**
   * Get the type of operation.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_type() { return $this->operation_record->type; }
  
  /**
   * Get the subject of operation.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_subject() { return $this->operation_record->subject; }
  
  /**
   * Get the name of operation.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_name() { return $this->operation_record->name; }
  
  /**
   * Get the full name of operation (subject_name)
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_full_name()
  { return $this->operation_record->subject.'_'.$this->operation_record->name; }
 
  /**
   * Get a query argument passed to the operation.
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
   * Get the operation's heading.
   * @author Dean Inglis <inglisdd@mcmaster.ca>
   * @access public
   */
  public function get_heading() { return $this->heading; }

  /**
   * Set the operation's heading.
   * @author Dean Inglis <inglisdd@mcmaster.ca>
   * @param string $heading
   * @access public
   */
  public function set_heading( $heading )
  {
    $this->heading = ucwords( str_replace( '_', ' ', $heading ) );
  }

  /**
   * Returns any data generated by the operation.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return mixed
   * @access public
   */
  public function get_data() { return $this->data; }

  /**
   * Gets whether to check if the user has access to the operation
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access protected
   */
  protected function get_validate_access()
  {
    return $this->validate_access;
  }

  /**
   * Sets whether to check if the user has access to the operation
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $access
   * @access protected
   */
  protected function set_validate_access( $access )
  {
    $this->validate_access = $access;
  }

  /**
   * The operation's heading.
   * @var string
   * @access protected
   */
  private $heading = NULL;

  /**
   * The database record for this operation
   * @var database\record
   * @access protected
   */
  protected $operation_record = NULL;

  /**
   * The url query arguments.
   * @var array( array )
   * @access protected
   */
  protected $arguments = array();

  /**
   * Data generated by the operation (if any).
   * @var mixed
   * @access protected
   */
  protected $data = NULL;

  /**
   * Whether to check if the user's access has permission to perform this operation
   * @var boolean
   * @access private
   */
  private $validate_access = true;
}
?>

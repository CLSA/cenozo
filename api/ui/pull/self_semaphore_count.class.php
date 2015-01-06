<?php
/**
 * self_semaphore_count.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\pull;
use cenozo\lib, cenozo\log;

/**
 * Base class for all list pull operations.
 * 
 * @abstract
 */
class self_semaphore_count extends \cenozo\ui\pull
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'self', 'semaphore_count', $args );
  }

  /**
   * Processes arguments, preparing them for the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();

    $operation_class_name = lib::get_class_name( 'database\operation' );
    $type = $this->get_argument( 'type' );
    $subject = $this->get_argument( 'subject' );
    $name = $this->get_argument( 'name' );
    $this->db_operation = $operation_class_name::get_operation( $type, $subject, $name );
  }

  /**
   * Validate the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws excpetion\runtime, exception\permission
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    // make sure the operation exists
    if( is_null( $this->db_operation ) )
      throw lib::create( 'exception\runtime',
        'The requested operation does not exist',
        __METHOD__ );
    
    // and that the user is allowed to run it
    if( !lib::create( 'business\session' )->is_allowed( $this->db_operation ) )
      throw lib::create( 'exception\permission', $this->db_operation, __METHOD__ );
  }

  /**
   * Sets up the operation with any pre-execution instructions that may be necessary.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();
  }

  /**
   * This method executes the operation's purpose.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    $semaphore_class_name = lib::get_class_name( 'business\semaphore' );

    // get the class name of the assignment operation and use lib to get its full path
    $name = sprintf( 'ui\%s\%s_%s',
                     $this->db_operation->type,
                     $this->db_operation->subject,
                     $this->db_operation->name );
    $semaphore = $this->get_argument( 'semaphore', NULL );

    // get the semaphore count for the assignment begin push operation
    $this->data = $semaphore_class_name::get_process_count(
      lib::get_full_class_path( $name ), $semaphore );
  }

  /**
   * An single integer is returned so use json format
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_data_type() { return 'json'; }

  /**
   * The operation record to get the semaphore count for
   * @var database\operation
   * @access protected
   */
  protected $db_operation;
}

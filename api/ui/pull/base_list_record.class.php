<?php
/**
 * base_list_record.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\pull;
use cenozo\lib, cenozo\log;

/**
 * Base class for all pull operations which 'list records' pertaining to a single record.
 * 
 * @abstract
 */
abstract class base_list_record extends base_record
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $subject, $child, $args )
  {
    parent::__construct( $subject, 'list_'.$child, $args );
    $this->child = $child;
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

    $this->set_record(
      lib::create( 'database\\'.$this->get_subject(), $this->get_argument( 'id', NULL ) ) );
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

    $this->data = array();
    
    $child_list_method = 'get_'.$this->child.'_list';
    foreach( $this->get_record()->$child_list_method() as $db_record )
    {
      $item = array();
      foreach( $db_record->get_column_names() as $column ) $item[ $column ] = $db_record->$column;
      $this->data[] = $item;
    }
  }

  /**
   * This class always returns json format
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_data_type() { return "json"; }
  
  /**
   * The name of the items being listed.
   * @var string
   * @access protected
   */
  protected $child = NULL;
}
?>

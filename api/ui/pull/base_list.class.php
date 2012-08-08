<?php
/**
 * base_list.class.php
 * 
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\pull;
use cenozo\lib, cenozo\log;

/**
 * Base class for all list pull operations.
 * 
 * @abstract
 */
abstract class base_list extends \cenozo\ui\pull
{
  /**
   * Constructor
   * 
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $subject, $args )
  {
    parent::__construct( $subject, 'list', $args );
  }

  /**
   * This method executes the operation's purpose.
   * 
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    $class_name = lib::get_class_name( 'database\\'.$this->get_subject() );

    if( $this->get_argument( 'count', false ) )
    { // get a count only
      $this->data = $class_name::count( $this->modifier );
    }
    else
    { // build an array of all records
      $this->data = array();
      foreach( $class_name::select( $this->modifier ) as $record )
        $this->data[] = $this->process_record( $record );
    }
  }

  /**
   * This method is called for each record in the list.  It is meant to be extended in order
   * to add extra details which this base class may not provide.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param database\record $record
   * @return array
   * @access protected
   */
  protected function process_record( $record )
  {
    $item = array();
    foreach( $record->get_column_names() as $column ) $item[$column] = $record->$column;
    return $item;
  }

  /**
   * Lists are always returned in JSON format.
   * 
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_data_type() { return "json"; }
}
?>

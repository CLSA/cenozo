<?php
/**
 * base_list.class.php
 * 
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\pull;
use cenozo\lib, cenozo\log;

/**
 * Base class for all list pull operations.
 * 
 * @abstract
 * @package cenozo\ui
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
    $this->process_restriction();
  }

  /**
   * Returns a list of all records in the list.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array
   * @access public
   */
  public function finish()
  {
    $modifier = lib::create( 'database\modifier' );
    foreach( $this->restrictions as $restrict )
      $modifier->where( $restrict['column'], $restrict['operator'], $restrict['value'] );

    $limit = $this->get_argument( 'limit', NULL );
    $offset = $this->get_argument( 'offset', 0 );
    if( !is_null( $limit ) ) $modifier->limit( $limit, $offset );

    $class_name = lib::get_class_name( 'database\\'.$this->get_subject() );
    $list = array();

    foreach( $class_name::select( $modifier ) as $record )
      $list[] = $this->process_record( $record );

    return $list;
  }

  /**
   * This method is called for each record in the list.  It is meant to be extended in order
   * to add extra details which this base class may not provide.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\record $record
   * @access protected
   */
  protected function process_record( $record )
  {
    $item = array();
    foreach( $record->get_column_names() as $column ) $item[$column] = $record->$column;
    return $item;
  }

  /**
   * Processes the restrictions argument, preparing restrictions for a database modifier
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function process_restriction()
  {
    $this->restrictions = array();
    $restrictions = $this->get_argument( 'restrictions', array() );
    
    if( is_array( $restrictions ) ) foreach( $restrictions as $column => $restrict )
    {
      $operator = NULL;
      $value = NULL;

      if( array_key_exists( 'value', $restrict ) && array_key_exists( 'compare', $restrict ) )
      {
        $value = $restrict['value'];
        if( 'is' == $restrict['compare'] )
        {
          $operator = '=';
        }
        else if( 'is not' == $restrict['compare'] )
        {
          $operator = '!=';
        }
        else if( 'like' == $restrict['compare'] )
        {
          $value = '%'.$value.'%';
          $operator = 'LIKE';
        }
        else if( 'not like' == $restrict['compare'] )
        {
          $value = '%'.$value.'%';
          $operator = 'NOT LIKE';
        }
        else if( 'in' == $restrict['compare'] )
        {
          if( !is_array( $value ) ) $value = explode( ',', $value );
          $operator = 'IN';
        }
        else log::err( 'Invalid comparison in list restriction.' );
      }

      if( !is_null( $operator ) && !is_null( $value ) )
      {
        $this->restrictions[] = array(
          'column' => $column,
          'operator' => $operator,
          'value' => 'NULL' == $value ? NULL : $value );
      }
    }
  }
  
  /**
   * Lists are always returned in JSON format.
   * 
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_data_type() { return "json"; }

  /**
   * An associative array of restrictions to apply to the list.
   * @var array
   * @access protected
   */
  protected $restrictions = array();
}
?>

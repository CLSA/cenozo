<?php
/**
 * base_primary.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\pull;
use cenozo\log, cenozo\util;

/**
 * Base class for pull operations which provide a record's primary information.
 * 
 * @abstract
 * @package cenozo\ui
 */
abstract class base_primary extends base_record
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The subject to retrieve the primary information from.
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $subject, $args )
  {
    parent::__construct( $subject, 'primary', $args );
    
    // make sure we have an id (we don't actually need to use it since the parent does)
    $this->get_argument( 'id' );
  }

  /**
   * Returns the data provided by this pull operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return associative array
   * @access public
   */
  public function finish()
  {
    $data = array();
    foreach( $this->get_record()->get_column_names() as $column )
      $data[ $column ] = $this->get_record()->$column;
    return $data;
  }

  /**
   * Primary data is always returned in json format
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_data_type() { return "json"; }
}
?>

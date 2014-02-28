<?php
/**
 * source_new.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: source new
 *
 * Create a new source.
 */
class source_new extends base_new
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'source', $args );
  }

  /**
   * Validate the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    // make sure the name column isn't blank
    $columns = $this->get_argument( 'columns' );
    if( !array_key_exists( 'name', $columns ) || 0 == strlen( $columns['name'] ) )
      throw lib::create( 'exception\notice',
        'The source\'s name cannot be left blank.', __METHOD__ );
  }
}

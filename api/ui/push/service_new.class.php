<?php
/**
 * service_new.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: service new
 *
 * Create a new service.
 */
class service_new extends base_new
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'service', $args );
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
        'The service\'s name cannot be left blank.', __METHOD__ );

    // make sure the name column contains letters, numbers and underscores only
    $columns = $this->get_argument( 'columns' );
    if( !array_key_exists( 'name', $columns ) || preg_match( '/[^a-zA-Z0-9_]/', $columns['name'] ) )
      throw lib::create( 'exception\notice',
        'The service\'s name can include letters, numbers and underscores only.', __METHOD__ );

    // make sure the title column isn't blank
    $columns = $this->get_argument( 'columns' );
    if( !array_key_exists( 'name', $columns ) || 0 == strlen( $columns['name'] ) )
      throw lib::create( 'exception\notice',
        'The service\'s name cannot be left blank.', __METHOD__ );
  }
}

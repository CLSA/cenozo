<?php
/**
 * collection_edit.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: collection edit
 *
 * Edit a collection.
 */
class collection_edit extends base_edit
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'collection', $args );
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
    if( array_key_exists( 'name', $columns ) )
    {
      if( 0 == strlen( $columns['name'] ) )
        throw lib::create( 'exception\notice',
          'The collection\'s name cannot be left blank.', __METHOD__ );

      // make sure the name column contains letters, numbers and underscores only
      if( preg_match( '/[^a-zA-Z0-9_]/', $columns['name'] ) )
        throw lib::create( 'exception\notice',
          'The collection\'s name can include letters, numbers and underscores only.', __METHOD__ );
    }
  }
}

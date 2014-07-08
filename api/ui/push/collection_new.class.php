<?php
/**
 * collection_new.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: collection new
 *
 * Create a new collection.
 */
class collection_new extends base_new
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
    if( !array_key_exists( 'name', $columns ) || 0 == strlen( $columns['name'] ) )
      throw lib::create( 'exception\notice',
        'The collection\'s name cannot be left blank.', __METHOD__ );
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

    // add the current user to the group's user list
    $this->get_record()->add_user( array( lib::create( 'business\session' )->get_user()->id ) );
  }
}

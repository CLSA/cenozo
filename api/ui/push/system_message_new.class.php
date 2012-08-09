<?php
/**
 * system_message_new.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: system_message new
 *
 * Create a new system_message.
 */
class system_message_new extends base_new
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'system_message', $args );
  }

  /**
   * Validate the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    $columns = $this->get_argument( 'columns' );

    // make sure the title and note are not blank
    if( !array_key_exists( 'title', $columns ) || 0 == strlen( $columns['title'] ) )
      throw lib::create( 'exception\notice',
        'The message\'s title cannot be left blank.', __METHOD__ );

    if( !array_key_exists( 'note', $columns ) || 0 == strlen( $columns['note'] ) )
      throw lib::create( 'exception\notice',
        'The message\'s note cannot be left blank.', __METHOD__ );
  }
}
?>

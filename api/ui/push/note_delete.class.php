<?php
/**
 * note_delete.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: note delete
 * 
 * Add a delete note to the provided category.
 */
class note_delete extends \cenozo\ui\push
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'note', 'delete', $args );
  }
  
  /**
   * This method executes the operation's purpose.  All operations must implement this method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    // make sure there is a valid note category
    $category = $this->get_argument( 'category' );
    $class_name = lib::get_class_name( 'database\\'.$category );
    $db_note = $class_name::get_note( $this->get_argument( 'id' ) );

    $db_note->delete();
  }
}

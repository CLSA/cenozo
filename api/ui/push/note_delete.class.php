<?php
/**
 * note_delete.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\log, cenozo\util;

/**
 * push: note delete
 * 
 * Add a delete note to the provided category.
 * @package cenozo\ui
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
   * Executes the push.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\runtime
   * @access public
   */
  public function finish()
  {
    // make sure there is a valid note category
    $category = $this->get_argument( 'category' );
    $class_name = util::get_class_name( 'database\\'.$category );
    $db_note = $class_name::get_note( $this->get_argument( 'id' ) );
    $db_note->delete();
  }
}
?>

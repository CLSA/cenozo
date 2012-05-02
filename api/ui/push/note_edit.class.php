<?php
/**
 * note_edit.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: note edit
 * 
 * Add a edit note to the provided category.
 * @package cenozo\ui
 */
class note_edit extends \cenozo\ui\push
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'note', 'edit', $args );
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
    $class_name = lib::get_class_name( 'database\\'.$category );
    $db_note = $class_name::get_note( $this->get_argument( 'id' ) );
    
    $sticky = $this->get_argument( 'sticky', NULL );
    if( !is_null( $sticky ) ) $db_note->sticky = 'true' == $sticky;
    
    $note = $this->get_argument( 'note', NULL );
    if( !is_null( $note ) ) $db_note->note = $note;

    // finishing may involve sending a machine request
    parent::finish();

    $db_note->save();
  }

  /**
   * Override parent method to handle the note category
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An argument list, usually those passed to the push operation.
   * @return array
   * @access protected
   */
  protected function convert_to_noid( $args )
  {
    $subject = sprintf( '%s_note', $args['category'] );
    $class_name = lib::get_class_name( 'database\\'.$subject );
    $args['noid'][$subject] = $class_name::get_unique_from_primary_key( $args['id'] );
    unset( $args['id'] );
    return $args;
  }
}
?>

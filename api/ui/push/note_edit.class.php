<?php
/**
 * note_edit.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: note edit
 * 
 * Add a edit note to the provided category.
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
    
    $sticky = $this->get_argument( 'sticky', NULL );
    if( !is_null( $sticky ) ) $db_note->sticky = 'true' == $sticky;
    
    $note = $this->get_argument( 'note', NULL );
    if( !is_null( $note ) ) $db_note->note = $note;

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

  /**
   * Override parent method to handle the note category
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An argument list, usually those passed to the push operation.
   * @return array
   * @access protected
   */
  protected function convert_from_noid( $args )
  {
    $category_note_key_name = sprintf( '%s_note_id', $args['category'] );
    $args = parent::convert_from_noid( $args );
    if( !array_key_exists( 'id', $args ) &&
        array_key_exists( $category_note_key_name, $args ) )
    {
      $args['id'] = $args[$category_note_key_name];
      unset( $args[$category_note_key_name] );
    }

    return $args;
  }
}
?>

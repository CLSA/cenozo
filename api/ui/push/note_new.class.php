<?php
/**
 * note_new.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: note new
 * 
 * Add a new note to the provided category.
 */
class note_new extends \cenozo\ui\push
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'note', 'new', $args );
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
    $category_id = $this->get_argument( 'category_id' );
    $note = $this->get_argument( 'note' );
    $db_record = lib::create( 'database\\'.$category, $category_id );
    if( !is_a( $db_record, lib::get_class_name( 'database\has_note' ) ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Tried to create new note to %s which cannot have notes.', $category ),
        __METHOD__ );

    $db_record->add_note( lib::create( 'business\session' )->get_user(), $note );
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
    $foreign_key = sprintf( '%s_id', $args['category'] );
    $args[$foreign_key] = $args['category_id'];
    unset( $args['category_id'] );
    return parent::convert_to_noid( $args );
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
    $args = parent::convert_from_noid( $args );
    if( $this->get_machine_request_received() )
    {
      $foreign_key = sprintf( '%s_id', $args['category'] );
      if( !array_key_exists( $foreign_key, $args ) )
        throw lib::create( 'exception\argument', 'args['.$foreign_key.']', NULL, __METHOD__ );
      $args['category_id'] = $args[$foreign_key];
      unset( $args[$foreign_key] );
    }
    return $args;
  }
}
?>

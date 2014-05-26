<?php
/**
 * language_view.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget language view
 */
class language_view extends base_view
{
  /**
   * Constructor
   * 
   * Defines all variables which need to be set for the associated template.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'language', 'view', $args );
  }

  /**
   * Processes arguments, preparing them for the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();

    $this->add_item( 'name', 'constant', 'Name' );
    $this->add_item( 'code', 'constant', 'Code' );
    $this->add_item( 'active', 'boolean', 'Active',
      'Setting this to yes will make this language appear in language lists' );
    $this->add_item( 'participants', 'constant', 'Participants' );
    $this->add_item( 'users', 'constant', 'Users' );
  }

  /**
   * Finish setting the variables in a widget.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $record = $this->get_record();

    // set the view's items
    $this->set_item( 'name', $record->name );
    $this->set_item( 'code', $record->code );
    $this->set_item( 'active', $record->active, true );
    $this->set_item( 'participants', $record->get_participant_count() );
    $this->set_item( 'users', $record->get_user_count() );
  }
}

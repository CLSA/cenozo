<?php
/**
 * source_view.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget source view
 */
class source_view extends base_view
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
    parent::__construct( 'source', 'view', $args );
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

    // create an associative array with everything we want to display about the source
    $this->add_item( 'name', 'string', 'Name' );
    $this->add_item( 'override_quota', 'boolean', 'Override Quota' );
    $this->add_item( 'participants', 'constant', 'Participants' );
    $this->add_item( 'description', 'string', 'Description' );
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
    $this->set_item( 'override_quota', $record->override_quota, true );
    $this->set_item( 'participants', $record->get_participant_count() );
    $this->set_item( 'description', $record->description );
  }
}

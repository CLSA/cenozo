<?php
/**
 * event_view.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget event view
 */
class event_view extends base_view
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
    parent::__construct( 'event', 'view', $args );
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
    
    // add items to the view
    $this->add_item( 'event_type_id', 'enum', 'Event' );
    $this->add_item( 'datetime', 'datetime', 'Date' );
  }

  /**
   * Sets up the operation with any pre-execution instructions that may be necessary.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $record = $this->get_record();
    $event_type_class_name = lib::get_class_name( 'database\event_type' );

    // create enum arrays
    $event_type_mod = lib::create( 'database\modifier' );
    $event_type_mod->order( 'name' );
    $event_types = array();
    foreach( $event_type_class_name::select( $event_type_mod ) as $db_event_type )
      $event_types[$db_event_type->id] = $db_event_type->name;

    // set the view's items
    $this->set_item( 'event_type_id', $record->get_event_type()->id, true, $event_types );
    $this->set_item( 'datetime', $record->datetime, true );
  }
}

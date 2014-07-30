<?php
/**
 * collection_list.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget collection list
 */
class collection_list extends base_list
{
  /**
   * Constructor
   * 
   * Defines all variables required by the collection list.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'collection', $args );
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
    
    $this->add_column( 'name', 'string', 'Name', true );
    $this->add_column( 'active', 'boolean', 'Active', true );
    $this->add_column( 'locked', 'boolean', 'Locked', true );
    $this->add_column( 'participants', 'number', 'Participants', false );
    $this->add_column( 'users', 'number', 'Users', false );
  }
  
  /**
   * Set the rows array needed by the template.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();
    
    foreach( $this->get_record_list() as $record )
    {
      $this->add_row( $record->id,
        array( 'name' => $record->name,
               'active' => $record->active,
               'locked' => $record->locked,
               'participants' => $record->get_participant_count(),
               'users' => $record->get_user_count() ) );
    }
  }
}

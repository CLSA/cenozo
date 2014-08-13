<?php
/**
 * collection_add_participant.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget collection add_participant
 */
class collection_add_participant extends base_add_list
{
  /**
   * Constructor
   * 
   * Defines all variables which need to be set for the associated template.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $name The name of the participant.
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'collection', 'participant', $args );
    $this->set_heading( '' );
  }

  /**
   * Overrides the participant list widget's method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return int
   * @access protected
   */
  public function determine_participant_count( $modifier = NULL )
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );

    $existing_participant_ids = array();
    foreach( $this->get_record()->get_participant_list() as $db_participant )
      $existing_participant_ids[] = $db_participant->id;

    if( 0 < count( $existing_participant_ids ) )
    {
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'id', 'NOT IN', $existing_participant_ids );
    }

    return $participant_class_name::count( $modifier );
  }

  /**
   * Overrides the participant list widget's method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return array( record )
   * @access protected
   */
  public function determine_participant_list( $modifier = NULL )
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );

    $existing_participant_ids = array();
    foreach( $this->get_record()->get_participant_list() as $db_participant )
      $existing_participant_ids[] = $db_participant->id;

    if( 0 < count( $existing_participant_ids ) )
    {
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'id', 'NOT IN', $existing_participant_ids );
    }

    return $participant_class_name::select( $modifier );
  }
}

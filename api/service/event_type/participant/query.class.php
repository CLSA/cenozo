<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\event_type\participant;
use cenozo\lib, cenozo\log;

/**
 * Extends parent class
 */
class query extends \cenozo\service\query
{
  /**
   * Extends parent method
   */
  protected function prepare()
  {
    parent::prepare();

    // the status will be 404, reset it to 200
    $this->status->set_code( 200 );
  }

  /**
   * Extends parent method
   */
  protected function get_record_count()
  {
    $participant_class_name = lib::create( 'database\participant' );

    $db_event_type = $this->get_parent_record();
    $modifier = clone $this->modifier;
    $modifier->join( 'event', 'participant.id', 'event.participant_id' );
    $modifier->where( 'event.event_type_id', '=', $db_event_type->id );

    return $participant_class_name::count( $modifier, true ); // distinct
  }

  /**
   * Extends parent method
   */
  protected function get_record_list()
  {
    $participant_class_name = lib::create( 'database\participant' );

    $db_event_type = $this->get_parent_record();
    $select = clone $this->select;
    $select->set_distinct( true );
    $modifier = clone $this->modifier;
    $modifier->join( 'event', 'participant.id', 'event.participant_id' );
    $modifier->where( 'event.event_type_id', '=', $db_event_type->id );

    return $participant_class_name::select( $select, $modifier );
  }
}

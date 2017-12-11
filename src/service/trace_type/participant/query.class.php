<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\trace_type\participant;
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

    $db_trace_type = $this->get_parent_record();
    $modifier = clone $this->modifier;
    $modifier->join( 'participant_last_trace', 'participant.id', 'participant_last_trace.participant_id' );
    $modifier->join( 'trace', 'participant_last_trace.trace_id', 'trace.id' );
    $modifier->join( 'trace_type', 'trace.trace_type_id', 'trace_type.id' );
    $modifier->where( 'trace.trace_type_id', '=', $db_trace_type->id );
    $this->select->apply_aliases_to_modifier( $modifier );

    return $participant_class_name::count( $modifier );
  }

  /**
   * Extends parent method
   */
  protected function get_record_list()
  {
    $participant_class_name = lib::create( 'database\participant' );

    $db_trace_type = $this->get_parent_record();
    $select = clone $this->select;
    $modifier = clone $this->modifier;
    $modifier->join( 'participant_last_trace', 'participant.id', 'participant_last_trace.participant_id' );
    $modifier->join( 'trace', 'participant_last_trace.trace_id', 'trace.id' );
    $modifier->join( 'trace_type', 'trace.trace_type_id', 'trace_type.id' );
    $modifier->where( 'trace.trace_type_id', '=', $db_trace_type->id );
    $this->select->apply_aliases_to_modifier( $modifier );

    return $participant_class_name::select( $select, $modifier );
  }
}

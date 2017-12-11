<?php
/**
 * trace.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * trace: record
 */
class trace extends record
{
  /**
   * Overrides the parent save method.
   * @access public
   */
  public function save()
  {
    $db_participant = lib::create( 'database\participant', $this->participant_id );

    // when adding new traces, make sure the last trace's type is not empty
    if( is_null( $this->id ) && is_null( $this->trace_type_id ) )
    {
      $db_trace = $db_participant->get_last_trace();
      if( is_null( $db_trace ) || is_null( $db_trace->trace_type_id ) )
        throw lib::create( 'exception\runtime', 'Tried to unnecessarily cancel a trace.', __METHOD__ );
    }

    parent::save();
  }
}

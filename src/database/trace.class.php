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

    // make sure not to add duplicate traces
    if( is_null( $this->id ) )
    {
      $db_last_trace = $db_particiapnt->get_last_trace();
      $last_trace_type_id = is_null( $db_last_trace ) ? NULL : $db_last_trace->trace_type_id;
      if( $last_trace_type_id == $this->trace_type_id )
        throw lib::create( 'exception\runtime', 'Tried to add duplicate trace.', __METHOD__ );
    }

    parent::save();
  }
}

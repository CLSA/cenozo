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
      $db_last_trace = $db_participant->get_last_trace();
      $last_trace_type_id = is_null( $db_last_trace ) ? NULL : $db_last_trace->trace_type_id;
      if( $last_trace_type_id == $this->trace_type_id )
        throw lib::create( 'exception\runtime', 'Tried to add duplicate trace.', __METHOD__ );
    }

    parent::save();

    if( is_null( $this->trace_type_id ) )
    {
      // when adding a trace with no type make sure to remove all trace mail for this participant
      $trace_mod = lib::create( 'database\modifier' );
      $trace_mod->where( 'trace_type_id', '!=', NULL );
      foreach( $db_participant->get_trace_object_list( $trace_mod ) as $db_trace )
      {
        $mail_mod = lib::create( 'database\modifier' );
        $mail_mod->where( 'sent_datetime', '=', NULL );
        foreach( $db_trace->get_mail_object_list( $mail_mod ) as $db_mail ) $db_mail->delete();
      }
    }
    else
    {
      // add any trace mail associated with the trace's type
      $this->add_mail();
    }
  }

  /**
   * Adds emails for this trace
   * @access public
   */
  public function add_mail()
  {
    $db_trace_type = $this->get_trace_type();
    if( !is_null( $db_trace_type ) )
    {
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'language_id', '=', $this->get_participant()->language_id );
      foreach( $db_trace_type->get_trace_type_mail_object_list( $modifier ) as $db_trace_type_mail )
        $db_trace_type_mail->add_mail( $this );
    }
  }
}

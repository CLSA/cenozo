<?php
/**
 * phone_call.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * phone_call: record
 */
class phone_call extends \cenozo\database\record
{
  /**
   * Override parent method if identifier is 0 (get record from session)
   */
  public static function get_record_from_identifier( $identifier )
  {
    // session objects can be loaded by using the identifier 0
    return 0 === $identifier || '0' === $identifier ?
      lib::create( 'business\session' )->get_user()->get_open_phone_call() :
      parent::get_record_from_identifier( $identifier );
  }

  /**
   * Overrides the parent save method.
   * @access public
   */
  public function save()
  {
    if( !is_null( $this->assignment_id ) && is_null( $this->end_datetime ) )
    {
      // make sure there is a maximum of 1 unfinished call per assignment
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'assignment_id', '=', $this->assignment_id );
      $modifier->where( 'end_datetime', '=', NULL );
      if( 0 < static::count( $modifier ) )
        throw lib::create( 'exception\runtime',
          'Cannot have more than one active phone call per assignment.', __METHOD__ );
    }

    parent::save();
  }

  /**
   * Processes application-based events based on this phone call
   * 
   * @access public
   */
  public function process_events()
  {
    if( !is_null( $this->end_datetime ) )
    {
      $session = lib::create( 'business\session' );
      $db_application = $session->get_application();
      $db_site = $session->get_site();
      $db_user = $session->get_user();
      $db_interview = $this->get_assignment()->get_interview();
      $db_participant = $db_interview->get_participant();

      // mark first attempt events
      $db_first_attempt_event_type = $db_application->get_first_attempt_event_type();
      if( !is_null( $db_first_attempt_event_type ) )
      {
        $event_mod = lib::create( 'database\modifier' );
        $event_mod->where( 'event_type_id', '=', $db_first_attempt_event_type->id );
        if( 0 == $db_participant->get_event_count( $event_mod ) )
        {
          $db_event = lib::create( 'database\event' );
          $db_event->participant_id = $db_participant->id;
          $db_event->event_type_id = $db_first_attempt_event_type->id;
          $db_event->site_id = $db_site->id;
          $db_event->user_id = $db_user->id;
          $db_event->datetime = $this->start_datetime;
          $db_event->save();
        }
      }

      // mark reached events
      $db_reached_event_type = $db_application->get_reached_event_type();
      if( !is_null( $db_reached_event_type ) )
      {
        $event_mod = lib::create( 'database\modifier' );
        $event_mod->where( 'event_type_id', '=', $db_reached_event_type->id );
        if( 'contacted' == $this->status && 0 == $db_participant->get_event_count( $event_mod ) )
        {
          $db_event = lib::create( 'database\event' );
          $db_event->participant_id = $db_participant->id;
          $db_event->event_type_id = $db_reached_event_type->id;
          $db_event->site_id = $db_site->id;
          $db_event->user_id = $db_user->id;
          $db_event->datetime = $this->start_datetime;
          $db_event->save();
        }
      }
    }
  }
}

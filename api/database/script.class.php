<?php
/**
 * script.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * script: record
 */
class script extends record
{
  /**
   * Adds all missing started events for this script
   */
  public function add_started_event_types( $db_participant )
  {
    static::add_all_started_event_types( $db_participant, $this );
  }

  /**
   * Adds all missing started events for all of this application's scripts
   */
  public static function add_all_started_event_types( $db_participant, $db_script = NULL )
  {
    static::add_all_event_types( $db_participant, $db_script, true, false );
  }

  /**
   * Adds all missing completed events for this script
   */
  public function add_completed_event_types( $db_participant )
  {
    static::add_all_completed_event_types( $db_participant, $this );
  }

  /**
   * Adds all missing completed events for all of this application's scripts
   */
  public static function add_all_completed_event_types( $db_participant, $db_script = NULL )
  {
    static::add_all_event_types( $db_participant, $db_script, false, true );
  }

  /**
   * TODO: document
   */
  public static function add_all_event_types(
    $db_participant, $db_script = NULL, $started_events = true, $completed_events = true )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $survey_class_name = lib::get_class_name( 'database\limesurvey\survey' );
    $tokens_class_name = lib::get_class_name( 'database\limesurvey\tokens' );
    $db_application = lib::create( 'business\session' )->get_application();
    $server_timezone = date_default_timezone_get();

    $select = lib::create( 'database\select' );
    $select->add_column( 'sid' );
    $select->add_column( 'repeated' );
    if( $started_events ) $select->add_column( 'started_event_type_id' );
    if( $completed_events ) $select->add_column( 'completed_event_type_id' );
    $select->from( 'script' );
    $modifier = lib::create( 'database\modifier' );
    if( !is_null( $db_script ) ) $modifier->where( 'script.id', '=', $db_script->id );

    foreach( $db_application->get_script_list( $select, $modifier ) as $script )
    {
      $old_sid = $survey_class_name::get_sid();
      $survey_class_name::set_sid( $script['sid'] );

      $survey_sel = lib::create( 'database\select' );
      if( $started_events )
        $survey_sel->add_column(
          sprintf( 'CONVERT_TZ( startdate, "%s", "UTC" )', $server_timezone ),
          'startdate',
          false );
      if( $completed_events )
        $survey_sel->add_column(
          sprintf( 'CONVERT_TZ( submitdate, "%s", "UTC" )', $server_timezone ),
          'submitdate',
          false );
      $survey_sel->from( $survey_class_name::get_table_name() );
      $survey_mod = lib::create( 'database\modifier' );
      $tokens_class_name::where_token( $survey_mod, $db_participant, $script['repeated'] );

      foreach( $survey_class_name::select( $survey_sel, $survey_mod ) as $survey )
      {
        // check if a start date exists within one minute of the survey's startdate and add it if not
        if( $started_events && !is_null( $survey['startdate'] ) )
        {
          $from_datetime = $util_class_name::get_datetime_object( $survey['startdate'] );
          $from_datetime->sub( new \DateInterval( 'PT1M' ) );
          $to_datetime = $util_class_name::get_datetime_object( $survey['startdate'] );
          $to_datetime->add( new \DateInterval( 'PT1M' ) );

          $event_mod = lib::create( 'database\modifier' );
          $event_mod->where( 'event_type_id', '=', $script['started_event_type_id'] );
          $event_mod->where( 'datetime', '>=', $from_datetime );
          $event_mod->where( 'datetime', '<=', $to_datetime );
          if( 0 == $db_participant->get_event_count( $event_mod ) )
          {
            $db_event = lib::create( 'database\event' );
            $db_event->participant_id = $db_participant->id;
            $db_event->event_type_id = $script['started_event_type_id'];
            $db_event->datetime = $survey['startdate'];
            $db_event->save();
          }
        }

        // check if a complete date exists within one minute of the survey's submitdate and add it if not
        if( $completed_events && !is_null( $survey['submitdate'] ) )
        {
          $from_datetime = $util_class_name::get_datetime_object( $survey['submitdate'] );
          $from_datetime->sub( new \DateInterval( 'PT1M' ) );
          $to_datetime = $util_class_name::get_datetime_object( $survey['submitdate'] );
          $to_datetime->add( new \DateInterval( 'PT1M' ) );

          $event_mod = lib::create( 'database\modifier' );
          $event_mod->where( 'event_type_id', '=', $script['completed_event_type_id'] );
          $event_mod->where( 'datetime', '>=', $from_datetime );
          $event_mod->where( 'datetime', '<=', $to_datetime );
          if( 0 == $db_participant->get_event_count( $event_mod ) )
          {
            $db_event = lib::create( 'database\event' );
            $db_event->participant_id = $db_participant->id;
            $db_event->event_type_id = $script['completed_event_type_id'];
            $db_event->datetime = $survey['submitdate'];
            $db_event->save();
          }
        }
      }

      $survey_class_name::set_sid( $old_sid );
    }
  }

  /**
   * Extend parent method
   */
  public function get_token_count( $modifier )
  {
    if( !$this->sid ) return 0;

    $tokens_class_name = lib::get_class_name( 'database\limesurvey\tokens' );
    $old_sid = $tokens_class_name::get_sid();
    $tokens_class_name::set_sid( $this->sid );
    $count = $tokens_class_name::count( $modifier );
    $tokens_class_name::set_sid( $old_sid );

    return $count;
  }

  /**
   * Extend parent method
   */
  public static function get_relationship( $record_type )
  {
    $relationship_class_name = lib::get_class_name( 'database\relationship' );
    return 'token' == $record_type || 'tokens' == $record_type ?
      $relationship_class_name::ONE_TO_MANY : parent::get_relationship( $record_type );
  }

  /**
   * Returns a special event-type associated with this script
   * 
   * Returns the event-type associated with when this script was started.
   * If no event-type exists this method will return NULL.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\event_type
   * @access public
   */
  public function get_started_event_type()
  {
    return is_null( $this->started_event_type_id ) ?
      NULL : lib::create( 'database\event_type', $this->started_event_type_id );
  }

  /**
   * Returns a special event-type associated with this script
   * 
   * Returns the event-type associated with when this script was completed.
   * If no event-type exists this method will return NULL.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\event_type
   * @access public
   */
  public function get_completed_event_type()
  {
    return is_null( $this->completed_event_type_id ) ?
      NULL : lib::create( 'database\event_type', $this->completed_event_type_id );
  }
}

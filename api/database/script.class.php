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
   * Adds all missing started/completed events
   */
  public function add_event_types( $db_participant )
  {
    static::add_all_event_types( $db_participant, $this );
  }

  /**
   * TODO: document
   */
  public static function add_all_event_types( $db_participant, $db_script = NULL )
  {
    $survey_class_name = lib::get_class_name( 'database\limesurvey\survey' );
    $tokens_class_name = lib::get_class_name( 'database\limesurvey\tokens' );

    $select = lib::create( 'database\select' );
    $select->add_column( 'sid' );
    $select->add_column( 'repeated' );
    $select->add_column( 'started_event_type_id' );
    $select->add_column( 'completed_event_type_id' );
    $select->from( 'script' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'reserved', '=', false );
    if( !is_null( $db_script ) ) $modifier->where( 'id', '=', $db_script->id );

    foreach( static::select( $select, $modifier ) as $script )
    {
      $survey_class_name::set_sid( $script['sid'] );

      $survey_sel = lib::create( 'database\select' );
      $survey_sel->add_column( 'startdate' );
      $survey_sel->add_column( 'submitdate' );
      $survey_sel->from( $survey_class_name::get_table_name() );
      $survey_mod = lib::create( 'database\modifier' );
      $tokens_class_name::where_token( $survey_mod, $db_participant, $script['repeated'] );

      foreach( $survey_class_name::select( $survey_sel, $survey_mod ) as $survey )
      {
        // check start date
        if( !is_null( $survey['startdate'] ) )
        {
          $event_mod = lib::create( 'database\modifier' );
          $event_mod->where( 'event_type_id', '=', $script['started_event_type_id'] );
          $event_mod->where( 'datetime', '=', $survey['startdate'] );
          if( 0 == $db_participant->get_event_count( $event_mod ) )
          {
            $db_event = lib::create( 'database\event' );
            $db_event->participant_id = $db_participant->id;
            $db_event->event_type_id = $script['started_event_type_id'];
            $db_event->datetime = $survey['startdate'];
            $db_event->save();
          }
        }

        // check end date
        if( !is_null( $survey['submitdate'] ) )
        {
          $event_mod = lib::create( 'database\modifier' );
          $event_mod->where( 'event_type_id', '=', $script['completed_event_type_id'] );
          $event_mod->where( 'datetime', '=', $survey['submitdate'] );
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
    }
  }

  /**
   * Extend parent method
   */
  public function get_token_count( $modifier )
  {
    if( !$this->sid ) return 0;

    $tokens_class_name = lib::get_class_name( 'database\limesurvey\tokens' );
    $tokens_class_name::set_sid( $this->sid );
    return $tokens_class_name::count( $modifier );
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

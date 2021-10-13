<?php
/**
 * script.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * script: record
 */
class script extends record
{
  /**
   * Determines whether the script is a withdraw type (has "withdraw" somewhere in the name)
   * 
   * @return boolean
   * @access public
   */
  public function is_withdraw_type()
  {
    return 1 == preg_match( '/withdraw/i', $this->name );
  }

  /**
   * Returns whether the script is in Pine or Limesurvey
   * 
   * @return string
   * @access public
   */
  public function get_type()
  {
    return !is_null( $this->pine_qnaire_id ) ? 'pine' : ( !is_null( $this->sid ) ? 'limesurvey' : NULL );
  }

  /**
   * Adds a started event to the participant for this script
   * 
   * @param database\participant $db_participant The event's participant
   * @param datetime $datetime The event's datetime
   * @access public
   */
  public function add_started_event( $db_participant, $datetime )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $session = lib::create( 'business\session' );
    $db_site = $session->get_site();
    $db_user = $session->get_user();

    if( !is_null( $this->started_event_type_id ) )
    {
      // check if a start date exists within one minute of the datetime and add it if not
      $from_datetime = $util_class_name::get_datetime_object( $datetime );
      $from_datetime->sub( new \DateInterval( 'PT1M' ) );
      $to_datetime = $util_class_name::get_datetime_object( $datetime );
      $to_datetime->add( new \DateInterval( 'PT1M' ) );

      $event_mod = lib::create( 'database\modifier' );
      $event_mod->where( 'event_type_id', '=', $this->started_event_type_id );
      $event_mod->where( 'datetime', '>=', $from_datetime );
      $event_mod->where( 'datetime', '<=', $to_datetime );
      if( 0 == $db_participant->get_event_count( $event_mod ) )
      {
        $db_event = lib::create( 'database\event' );
        $db_event->participant_id = $db_participant->id;
        $db_event->event_type_id = $this->started_event_type_id;
        if( !is_null( $db_site ) ) $db_event->site_id = $db_site->id;
        if( !is_null( $db_user ) ) $db_event->user_id = $db_user->id;
        $db_event->datetime = $util_class_name::get_datetime_object( $datetime );
        $db_event->save();
      }
    }
  }

  /**
   * Adds a finished event to the participant for this script
   * 
   * @param database\participant $db_participant The event's participant
   * @param datetime $datetime The event's datetime
   * @access public
   */
  public function add_finished_event( $db_participant, $datetime )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $session = lib::create( 'business\session' );
    $db_site = $session->get_site();
    $db_user = $session->get_user();

    if( !is_null( $this->finished_event_type_id ) )
    {
      // check if a finish date exists within one minute of the datetime and add it if not
      $from_datetime = $util_class_name::get_datetime_object( $datetime );
      $from_datetime->sub( new \DateInterval( 'PT1M' ) );
      $to_datetime = $util_class_name::get_datetime_object( $datetime );
      $to_datetime->add( new \DateInterval( 'PT1M' ) );

      $event_mod = lib::create( 'database\modifier' );
      $event_mod->where( 'event_type_id', '=', $this->finished_event_type_id );
      $event_mod->where( 'datetime', '>=', $from_datetime );
      $event_mod->where( 'datetime', '<=', $to_datetime );
      if( 0 == $db_participant->get_event_count( $event_mod ) )
      {
        $db_event = lib::create( 'database\event' );
        $db_event->participant_id = $db_participant->id;
        $db_event->event_type_id = $this->finished_event_type_id;
        $db_event->site_id = $db_site->id;
        $db_event->user_id = $db_user->id;
        $db_event->datetime = $util_class_name::get_datetime_object( $datetime );
        $db_event->save();
      }
    }
  }

  /**
   * Adds all missing started events for this script
   * 
   * @param database\participant $db_participant
   * @access public
   */
  public function add_started_event_types( $db_participant )
  {
    static::add_all_started_event_types( $db_participant, $this );
  }

  /**
   * Adds all missing started events for all of this application's scripts
   * 
   * @param database\participant $db_participant
   * @param database\script $db_script
   * @access public
   * @static
   */
  public static function add_all_started_event_types( $db_participant, $db_script = NULL )
  {
    static::add_all_event_types( $db_participant, $db_script, true, false );
  }

  /**
   * Adds all missing finished events for this script
   * 
   * @param database\participant $db_participant
   * @access public
   */
  public function add_finished_event_types( $db_participant )
  {
    static::add_all_finished_event_types( $db_participant, $this );
  }

  /**
   * Adds all missing finished events for all of this application's scripts
   * 
   * @param database\participant $db_participant
   * @param database\script $db_script
   * @access public
   * @static
   */
  public static function add_all_finished_event_types( $db_participant, $db_script = NULL )
  {
    static::add_all_event_types( $db_participant, $db_script, false, true );
  }

  /**
   * Adds a script's missing events to a participant.
   * 
   * @param database\participant $db_participant
   * @param database\script $db_script
   * @param boolean $started_events Whether to include started_events
   * @param boolean $finished_events Whether to include finished_events
   * @access public
   * @static
   */
  public static function add_all_event_types(
    $db_participant, $db_script = NULL, $started_events = true, $finished_events = true )
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    if( !$setting_manager->get_setting( 'module', 'script' ) )
    {
      throw lib::create( 'exception\runtime',
        'Tried to add script event types but the script module is not enabled.',
        __METHOD__ );
    }

    $survey_class_name = lib::get_class_name( 'database\limesurvey\survey' );
    $tokens_class_name = lib::get_class_name( 'database\limesurvey\tokens' );
    $db_application = lib::create( 'business\session' )->get_application();
    $server_timezone = date_default_timezone_get();

    $modifier = lib::create( 'database\modifier' );
    if( $started_events ) $modifier->where( 'started_event_type_id', '!=', NULL );
    if( $finished_events ) $modifier->where( 'finished_event_type_id', '!=', NULL );
    if( !is_null( $db_script ) ) $modifier->where( 'script.id', '=', $db_script->id );
    $modifier->where( 'repeated', '=', false );

    foreach( $db_application->get_script_object_list( $modifier ) as $db_script )
    {
      // only limesurvey scripts need events added (Pine does this automatically)
      if( !is_null( $db_script->sid ) )
      {
        $old_sid = $survey_class_name::get_sid();
        $survey_class_name::set_sid( $db_script->sid );

        $survey_sel = lib::create( 'database\select' );
        if( $started_events )
          $survey_sel->add_column(
            sprintf( 'CONVERT_TZ( startdate, "%s", "UTC" )', $server_timezone ),
            'startdate',
            false );
        if( $finished_events )
          $survey_sel->add_column(
            sprintf( 'CONVERT_TZ( submitdate, "%s", "UTC" )', $server_timezone ),
            'submitdate',
            false );
        $survey_sel->from( $survey_class_name::get_table_name() );
        $survey_mod = lib::create( 'database\modifier' );
        $tokens_class_name::where_token( $survey_mod, $db_participant, false );

        foreach( $survey_class_name::select( $survey_sel, $survey_mod ) as $survey )
        {
          // check if a start date exists within one minute of the survey's startdate and add it if not
          if( $started_events && !is_null( $survey['startdate'] ) )
            $db_script->add_started_event( $db_participant, $survey['startdate'] );

          // check if a complete date exists within one minute of the survey's submitdate and add it if not
          if( $finished_events && !is_null( $survey['submitdate'] ) )
            $db_script->add_finished_event( $db_participant, $survey['submitdate'] );
        }

        $survey_class_name::set_sid( $old_sid );
      }
    }
  }

  /**
   * Extend parent method
   * Note: this is used by limesurvey only (ignored by pine scripts)
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
   * Returns the event-type associated with when this script was finished.
   * If no event-type exists this method will return NULL.
   * @return database\event_type
   * @access public
   */
  public function get_finished_event_type()
  {
    return is_null( $this->finished_event_type_id ) ?
      NULL : lib::create( 'database\event_type', $this->finished_event_type_id );
  }

  /**
   * Updates metadata about all scripts
   * @static 
   */
  public static function update_data()
  {
    $util_class_name = lib::get_class_name( 'util' );
    $cenozo_manager = lib::create( 'business\cenozo_manager', 'pine' );
    if( $cenozo_manager->exists() )
    {
      // get a list of all pine qnaire ids
      $pine_qnaire_id_list = array();
      $script_mod = lib::create( 'database\modifier' );
      $script_mod->where( 'pine_qnaire_id', '!=', NULL );
      $script_list = static::select_objects( $script_mod );
      foreach( $script_list as $db_script ) $pine_qnaire_id_list[] = $db_script->pine_qnaire_id;

      if( 0 < count( $pine_qnaire_id_list ) )
      {
        $select = array( 'column' => array( 'id', 'total_pages' ));
        $modifier = array(
          'where' => array(
            'column' => 'qnaire.id',
            'operator' => 'IN',
            'value' => $pine_qnaire_id_list
          )
        );

        $service = sprintf(
          'qnaire?no_activity=1&select=%s&modifier=%s',
          $util_class_name::json_encode( $select ),
          $util_class_name::json_encode( $modifier )
        );
        
        $data = array();
        foreach( $cenozo_manager->get( $service ) as $obj ) $data[$obj->id] = $obj->total_pages;

        foreach( $script_list as $db_script )
        {
          if( !array_key_exists( $db_script->pine_qnaire_id, $data ) )
          {
            log::warning( sprintf(
              'Tried to update script "%s" but corresponding pine_qnaire_id "%d" does not exist in Pine.',
              $db_script->name,
              $db_script->pine_qnaire_id
            ) );
          }
          else
          {
            $db_script->total_pages = $data[$db_script->pine_qnaire_id];
            $db_script->save();
          }
        }
      }
    }
  }
}

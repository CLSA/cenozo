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
   * Returns whether the script is in Pine or unsupported (external) survey software
   * 
   * @return string
   * @access public
   */
  public function get_type()
  {
    return !is_null( $this->pine_qnaire_id ) ? 'pine' : 'external';
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
    $cenozo_manager = lib::create( 'business\cenozo_manager', lib::create( 'business\session' )->get_pine_application() );
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
        $select_obj = array( 'column' => array( 'id', 'total_pages' ) );
        $modifier_obj = array(
          'where' => array(
            'column' => 'qnaire.id',
            'operator' => 'IN',
            'value' => $pine_qnaire_id_list
          )
        );
        $service = sprintf(
          'qnaire?no_activity=1&select=%s&modifier=%s',
          $util_class_name::json_encode( $select_obj ),
          $util_class_name::json_encode( $modifier_obj )
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

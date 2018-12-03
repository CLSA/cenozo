<?php
/**
 * supporting_script_check.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * supporting_script_check: record
 */
class supporting_script_check extends record
{
  /**
   * Returns whether the check has expired (its datetime is past the timeout value)
   */
  public function is_expired()
  {
    $util_class_name = lib::get_class_name( 'util' );
    $setting_manager = lib::create( 'business\setting_manager' );
    $now = $util_class_name::get_datetime_object();
    $now->sub( new \DateInterval( sprintf( 'PT%dM', $setting_manager->get_setting( 'general', 'supporting_script_timeout' ) ) ) );
    return $now > $this->datetime;
  }

  /**
   * Uses the script manager to process this check
   */
  public function process()
  {
    $survey_manager = lib::create( 'business\survey_manager' );
    $survey_manager->process_supporting_script_check( $this->get_participant(), $this->get_script() );
  }

  /**
   * Adds a new check for the given participant/script, or updates an existing one to the current datetime
   * 
   * @param database\participant $db_participant
   * @param database\script $db_script
   */
  public static function update_check( $db_participant, $db_script )
  {
    $util_class_name = lib::get_class_name( 'util' );

    // see if a record already exists
    $db_supporting_script_check = static::get_unique_record(
      array( 'participant_id', 'script_id' ),
      array( $db_participant->id, $db_script->id )
    );

    // if not then create one
    if( is_null( $db_supporting_script_check ) )
    {
      $db_supporting_script_check = new static();
      $db_supporting_script_check->participant_id = $db_participant->id;
      $db_supporting_script_check->script_id = $db_script->id;
    }

    // set the datetime to now
    $db_supporting_script_check->datetime = $util_class_name::get_datetime_object();
    $db_supporting_script_check->save();
  }

  /**
   * Removes any checks for the given participant/script
   * 
   * @param database\participant $db_participant
   * @param database\script $db_script
   * @param boolean $expired Whether to only delete expired checks
   */
  public static function delete_check( $db_participant, $db_script, $expired = false )
  {
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'participant_id', '=', $db_participant->id );
    $modifier->where( 'script_id', '=', $db_script->id );
    if( $expired )
    {
      $setting_manager = lib::create( 'business\setting_manager' );
      $timeout = $setting_manager->get_setting( 'general', 'supporting_script_timeout' );
      $modifier->where( 'datetime', '<', sprintf( 'UTC_TIMESTAMP() - INTERVAL %d MINUTE', $timeout ), false );
    }
    return static::db()->execute( sprintf( 'DELETE FROM supporting_script_check %s', $modifier->get_sql() ) );
  }
}

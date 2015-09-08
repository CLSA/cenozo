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

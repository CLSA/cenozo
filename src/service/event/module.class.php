<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\event;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\module
{
  /**
   * Extend parent method
   */
  public function validate()
  {
    parent::validate();

    // make sure the application has access to the participant
    $db_application = lib::create( 'business\session' )->get_application();
    $db_event = $this->get_resource();
    if( $db_application->release_based && !is_null( $db_event ) )
    {
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'participant_id', '=', $db_event->participant_id );
      if( 0 == $db_application->get_participant_count( $modifier ) ) $this->get_status()->set_code( 404 );
    }
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    if( $select->has_table_columns( 'event_address' ) || $select->has_table_columns( 'region' ) )
    {
      $modifier->left_join( 'event_address', 'event.id', 'event_address.event_id' );
      if( $select->has_table_columns( 'region' ) )
        $modifier->left_join( 'region', 'event_address.region_id', 'region.id' );
    }
  }

  /**
   * Extend parent method
   */
  public function pre_write( $record )
  {
    $util_class_name = lib::get_class_name( 'util' );

    // if no datetime is provided then use the current datetime
    if( is_null( $record->datetime ) ) $record->datetime = $util_class_name::get_datetime_object();
  }
}

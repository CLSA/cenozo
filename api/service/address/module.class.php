<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\address;
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
    $db_address = $this->get_resource();
    if( $db_application->release_based && !is_null( $db_address ) )
    {
      $participant_id = $db_address->participant_id;
      if( is_null( $participant_id ) ) $participant_id = $db_address->get_alternate()->participant_id;
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'participant_id', '=', $participant_id );
      if( 0 == $db_application->get_participant_count( $modifier ) ) $this->get_status()->set_code( 404 );
    }
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    $util_class_name = lib::get_class_name( 'util' );

    parent::prepare_read( $select, $modifier );

    // add the "participant_uid" column if needed
    if( $select->has_table_alias( 'participant', 'participant_uid' ) )
      $modifier->left_join( 'participant', 'address.participant_id', 'participant.id' );

    // add the "available" column if needed
    if( $select->has_column( 'available' ) )
    {
      // check if the address is available this month
      $month = strtolower( $util_class_name::get_datetime_object()->format( 'F' ) );
      $select->add_column( $month, 'available' );
    }

    // add the "summary" and "international_region" columns if needed
    if( $select->has_column( 'summary' ) || $select->has_column( 'international_region' ) )
    {
      $modifier->left_join( 'region', 'address.region_id', 'region.id' );

      if( $select->has_column( 'summary' ) )
        $select->add_column(
          'CONCAT( rank, ") ", CONCAT_WS( ", ", address1, address2, city, region.name ) )', 'summary', false );
      if( $select->has_column( 'international_region' ) )
        $select->add_column(
          'IFNULL( region.name, "(international)" )', 'international_region', false );
    }
    else if( $modifier->has_join( 'region' ) )
    {
      // make sure the join to the region table is a left join
      $modifier->left_join( 'region', 'address.region_id', 'region.id' );
    }
  }

  /**
   * Extend parent method
   */
  public function pre_write( $record )
  {
    // source the postcode
    if( !$record->international && is_null( $record->region_id ) ) $record->source_postcode();
  }
}

<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
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

    if( $this->service->may_continue() )
    {
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
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    $util_class_name = lib::get_class_name( 'util' );

    parent::prepare_read( $select, $modifier );

    $modifier->left_join( 'region', 'address.region_id', 'region.id' );
    $modifier->left_join( 'country', 'region.country_id', 'country.id' );
    $modifier->left_join( 'country', 'address.international_country_id', 'international_country.id', 'international_country' );

    // add the "participant_uid" column if needed
    if( $select->has_table_alias( 'participant', 'participant_uid' ) )
      $modifier->left_join( 'participant', 'address.participant_id', 'participant.id' );

    // add the "available" column if needed
    if( $select->has_column( 'available' ) )
    {
      // check if the address is available this month
      $month = strtolower( $util_class_name::get_datetime_object()->format( 'F' ) );
      $select->add_table_column( 'address', $month, 'available' );
    }

    // add the "summary" and "region" columns if needed
    if( $select->has_column( 'summary' ) || $select->has_column( 'region' ) )
    {
      if( $select->has_column( 'summary' ) )
        $select->add_column(
          'CONCAT( rank, ") ", CONCAT_WS( ", ", address1, address2, city, region.name ) )', 'summary', false );
      if( $select->has_column( 'region' ) )
        $select->add_column(
          'IF( '.
            'international, '.
            'IFNULL( CONCAT_WS( ", ", international_region, international_country.name ), "(international)" ), '.
            'region.name '.
          ')',
          'region',
          false );
    }

    // include supplemental data
    if( !is_null( $this->get_resource() ) )
      $select->add_table_column( 'international_country', 'name', 'formatted_international_country_id' );
  }
}

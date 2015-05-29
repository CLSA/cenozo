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
    $valid = parent::validate();

    if( $valid )
    {
      // addresses can only be listed in the context of an alternate or participant
      $valid = in_array( $this->get_parent_subject(), array( 'alternate', 'participant' ) );
    }

    return $valid;
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    $util_class_name = lib::get_class_name( 'util' );

    parent::prepare_read( $select, $modifier );

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

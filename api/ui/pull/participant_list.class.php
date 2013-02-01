<?php
/**
 * participant_list.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\pull;
use cenozo\lib, cenozo\log;

/**
 * Class for participant list pull operations.
 * 
 * @abstract
 */
class participant_list extends base_list
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'participant', $args );
  }

  /**
   * Overrides the parent method to add participant address, phone and consent details.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\record $record
   * @return array
   * @access public
   */
  public function process_record( $record )
  {
    $source_class_name = lib::get_class_name( 'database\source' );
    $cohort_class_name = lib::get_class_name( 'database\cohort' );
    $age_group_class_name = lib::get_class_name( 'database\age_group' );

    $item = parent::process_record( $record );

    // convert primary ids to unique
    $item['source_id'] =
      $source_class_name::get_unique_from_primary_key( $item['source_id'] );
    $item['cohort_id'] =
      $cohort_class_name::get_unique_from_primary_key( $item['cohort_id'] );
    $item['age_group_id'] =
      $age_group_class_name::get_unique_from_primary_key( $item['age_group_id'] );

    // add the primary address
    $db_address = $record->get_primary_address();
    if( !is_null( $db_address ) )
    {
      $item['street'] = is_null( $db_address->address2 )
                      ? $db_address->address1
                      : $db_address->address1.', '.$db_address->address2;
      $item['city'] = $db_address->city;
      $item['region'] = $db_address->get_region()->name;
      $item['postcode'] = $db_address->postcode;
    }

    return $item;
  }
}

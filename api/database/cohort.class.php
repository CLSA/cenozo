<?php
/**
 * cohort.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * cohort: record
 */
class cohort extends record
{
  /**
   * Extend parent method by restricting selection to records belonging to this service only
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the selection.
   * @param boolean $count If true the total number of records instead of a list
   * @param boolean $distinct Whether to use the DISTINCT sql keyword
   * @access public
   * @static
   */
  public static function select( $modifier = NULL, $count = false, $distinct = true )
  {
    $db_service = lib::create( 'business\session' )->get_service();
    if( $db_service->release_based )
    {
      // make sure to only include cohorts belonging to this application
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'service_has_cohort.service_id', '=',
                        lib::create( 'business\session' )->get_service()->id );
    }

    return parent::select( $modifier, $count, $distinct );
  }

  /**
   * Override parent method by restricting returned records to those belonging to this service only
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string|array $column A column with the unique key property (or array of columns)
   * @param string|array $value The value of the column to match (or array of values)
   * @return database\record
   * @static
   * @access public
   */
  public static function get_unique_record( $column, $value )
  {
    $db_service = lib::create( 'business\session' )->get_service();
    $db_cohort = parent::get_unique_record( $column, $value );

    // make sure to only include cohorts belonging to this application
    if( $db_service->release_based )
    {
      $service_mod = lib::create( 'database\modifier' );
      $service_mod->where( 'service_id', '=', $db_service->id );
      if( !is_null( $db_cohort ) &&
          0 == $db_cohort->get_service_count( $service_mod ) ) $db_cohort = NULL;
    }

    return $db_cohort;
  }

  /**
   * Make sure to only include services which this cohort has access to.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $record_type The type of record.
   * @param modifier $modifier A modifier to apply to the list or count.
   * @param boolean $inverted Whether to invert the count (count records NOT in the joining table).
   * @param boolean $count If true then this method returns the count instead of list of records.
   * @param boolean $distinct Whether to use the DISTINCT sql keyword
   * @return array( record ) | int
   * @access protected
   */
  protected function get_record_list(
    $record_type, $modifier = NULL, $inverted = false, $count = false, $distinct = true )
  { 
    if( 'service' == $record_type )
    {
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'service_has_cohort.service_id', '=',
                        lib::create( 'business\session' )->get_service()->id );
    }                   
    return parent::get_record_list( $record_type, $modifier, $inverted, $count, $distinct );
  }
}

<?php
/**
 * jurisdiction.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * jurisdiction: record
 */
class jurisdiction extends record
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
      // make sure to only include jurisdictions belonging to this application
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'jurisdiction.service_id', '=', $db_service->id );
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
    $db_jurisdiction = parent::get_unique_record( $column, $value );

    // make sure to only include jurisdictions belonging to this application
    if( $db_service->release_based )
    {
      if( !is_null( $db_jurisdiction ) &&
          $db_jurisdiction->service_id != $db_service->id ) $db_jurisdiction = NULL;
    }

    return $db_jurisdiction;
  }
}

<?php
/**
 * quota.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filequota
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * quota: record
 */
class quota extends record
{
  /**
   * Extend parent method by restricting selection to records belonging to this appointment only
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the selection.
   * @param boolean $count If true the total number of records instead of a list
   * @param boolean $distinct Whether to use the DISTINCT sql keyword
   * @param boolean $id_only Whether to return a list of primary ids instead of active records
   * @param boolean $full If true then records will not be restricted by appointment
   * @access public
   * @static
   */
  public static function select(
    $modifier = NULL, $count = false, $distinct = true, $id_only = false, $full = false )
  {
    if( !$full )
    {
      // make sure to only include quotas belonging to this application
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where(
        'site.appointment_id', '=', lib::create( 'business\session' )->get_appointment()->id );
    }

    return parent::select( $modifier, $count, $distinct, $id_only );
  }

  /**
   * Override parent method by restricting returned records to those belonging to this appointment only
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string|array $column A column with the unique key property (or array of columns)
   * @param string|array $value The value of the column to match (or array of values)
   * @param boolean $full If true then records will not be restricted by appointment
   * @return database\record
   * @static
   * @access public
   */
  public static function get_unique_record( $column, $value, $full = false )
  {
    $db_quota = parent::get_unique_record( $column, $value );

    if( !$full )
    {
      if( !is_null( $db_quota ) &&
          $db_quota->get_site()->appointment_id !=
            lib::create( 'business\session' )->get_appointment()->id ) $db_quota = NULL;
    }

    return $db_quota;
  }
}

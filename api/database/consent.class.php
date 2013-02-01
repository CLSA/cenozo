<?php
/**
 * consent.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * consent: record
 */
class consent extends record
{
  /**
   * Custom sql function used to get the number of withdraws.
   * The modifier argument may include columns in the participant, address, region and consent
   * tables.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return integer
   * @static
   * @access public
   */
  public static function get_withdraw_count( $modifier = NULL )
  {
    $sub_select =
      '( SELECT participant_id FROM consent '.
      'WHERE event IN ( "verbal accept", "written accept" ) )';

    if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'event', 'NOT IN', array( 'verbal accept', 'written accept' ) );
    $modifier->where( 'consent.participant_id', 'IN', $sub_select, false );

    // need custom SQL
    return static::db()->get_one(
      'SELECT count(*) '.
      'FROM participant '.
      'JOIN participant_primary_address ON participant.id = participant_primary_address.participant_id '.
      'JOIN address ON participant_primary_address.address_id = address.id '.
      'JOIN region ON address.region_id = region.id '.
      'JOIN participant_last_consent ON participant.id = participant_last_consent.participant_id '.
      'JOIN consent ON participant_last_consent.consent_id = consent.id '.
      $modifier->get_sql() );
  }
}

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
   * Override select method to restrict sites to current application
   */
  public static function select( $select = NULL, $modifier = NULL, $return_alternate = '' )
  {
    if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'site', 'quota.site_id', 'site.id' );
    $modifier->where( 'site.application_id', '=', lib::create( 'business\session' )->get_application()->id );

    return parent::select( $select, $modifier, $return_alternate );
  }
}

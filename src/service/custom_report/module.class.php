<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\custom_report;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    // restrict non-administrators to custom reports the role has access to
    $db_role = lib::create( 'business\session' )->get_role();
    if( 'administrator' != $db_role->name )
    {
      $modifier->join( 'role_has_custom_report', 'custom_report.id', 'role_has_custom_report.custom_report_id' );
      $modifier->where( 'role_has_custom_report.role_id', '=', $db_role->id );
    }
  }
}

<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\access;
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

    // only include sites which belong to this application
    $modifier->join( 'application_has_site', 'access.site_id', 'application_has_site.site_id' );
    $modifier->where(
      'application_has_site.application_id', '=', lib::create( 'business\session' )->get_application()->id );
  }
}

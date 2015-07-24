<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\activity;
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

    $session = lib::create( 'business\session' );

    // only include sites which belong to this application
    $modifier->join( 'application_has_site', 'activity.site_id', 'application_has_site.site_id' );
    $modifier->where( 'application_has_site.application_id', '=', $session->get_application()->id );

    // restrict to the current site only (for some roles)
    if( !$session->get_role()->all_sites )
      $modifier->where( 'activity.site_id', '=', $session->get_site()->id );
  }
}

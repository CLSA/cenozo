<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\quota;
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

    // only include quotas which belong to this application
    $modifier->join( 'site', 'quota.site_id', 'site.id' );
    $modifier->where( 'site.application_id', '=', $session->get_application()->id );

    // restrict to the current site only (for some roles)
    if( !$session->get_role()->all_sites )
      $modifier->where( 'quota.site_id', '=', $session->get_site()->id );

    // add the age_group range
    $select->add_column( 'CONCAT( age_group.lower, " to ", age_group.upper )', 'age_group_range', false );
    $modifier->join( 'age_group', 'quota.age_group_id', 'age_group.id' );
  }
}

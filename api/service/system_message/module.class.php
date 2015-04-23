<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\system_message;
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

    // only include system_messages which belong to this application (or by role)
    $modifier->left_join( 'site', 'system_message.site_id', 'site.id' );

    if( $session->get_role()->all_sites )
      $modifier->where( 'site.application_id', '=', $session->get_application()->id );
    else $modifier->where( 'system_message.site_id', '=', $session->get_site()->id );

    // include records where the site is null (they are meant for all sites)
    $modifier->or_where( 'system_message.site_id', '=', NULL );

  }
}

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

    // left join to application, site and role since they may be null
    $modifier->left_join( 'application', 'system_message.application_id', 'application.id' );
    $modifier->left_join( 'site', 'system_message.site_id', 'site.id' );
    $modifier->left_join( 'role', 'system_message.role_id', 'role.id' );

    $application_id = $session->get_application()->id;
    $column = sprintf( 'IFNULL( system_message.application_id, %d )', $application_id );
    $modifier->where( $column, '=', $application_id );

    if( !$session->get_role()->all_sites )
    {
      $site_id = $session->get_site()->id;
      $column = sprintf( 'IFNULL( system_message.site_id, %d )', $site_id );
      $modifier->where( $column, '=', $site_id );
    }
  }
}

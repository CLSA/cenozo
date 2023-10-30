<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\log_entry;
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
    $db_application = lib::create( 'business\session' )->get_application();

    parent::prepare_read( $select, $modifier );

    $modifier->join( 'application', 'log_entry.application_id', 'application.id' );


    if( 'mastodon' != $db_application->name )
    {
      $modifier->where( 'application_id', '=', $db_application->id );
    }
  }
}

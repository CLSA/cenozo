<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\activity;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\site_restricted_module
{
  /**
   * Extend parent method
   */
  public function validate()
  {
    parent::validate();

    if( $this->service->may_continue() )
    {
      // restrict by application
      $record = $this->get_resource();
      if( $record && !is_null( $record->application_id ) &&
          $record->application_id != lib::create( 'business\session' )->get_application()->id )
      {
        $this->get_status()->set_code( 404 );
      }
      else
      {
        // restrict by site
        $db_restrict_site = $this->get_restricted_site();
        if( !is_null( $db_restrict_site ) )
        {
          $record = $this->get_resource();
          if( $record && $record->site_id != $db_restrict_site->id ) $this->get_status()->set_code( 403 );
        }
      }
    }
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $db_application = lib::create( 'business\session' )->get_application();

    // only include sites which belong to this application
    $modifier->where( 'activity.application_id', '=', $db_application->id );

    // restrict by site
    $db_restrict_site = $this->get_restricted_site();
    if( !is_null( $db_restrict_site ) )
      $modifier->where( 'activity.site_id', '=', $db_restrict_site->id );
  }
}

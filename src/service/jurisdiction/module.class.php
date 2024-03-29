<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\jurisdiction;
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
      // restrict by site
      $db_restrict_site = $this->get_restricted_site();
      if( !is_null( $db_restrict_site ) )
      {
        $record = $this->get_resource();
        if( $record && $record->site_id != $db_restrict_site->id ) $this->get_status()->set_code( 403 );
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

    // only include jurisdictions which belong to this application
    $modifier->join( 'application_has_site', 'jurisdiction.site_id', 'application_has_site.site_id' );
    $modifier->where( 'application_has_site.application_id', '=', $db_application->id );

    // restrict by site
    $db_restrict_site = $this->get_restricted_site();
    if( !is_null( $db_restrict_site ) ) $modifier->where( 'jurisdiction.site_id', '=', $db_restrict_site->id );
  }
}

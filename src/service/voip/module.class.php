<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\voip;
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
      // make sure we can connect to the voip server
      $voip_manager = lib::create( 'business\voip_manager' );
      if( !$voip_manager->test_connection() )
      {
        $this->get_status()->set_code( 503 );
        $this->set_data( 'Unable to connect to Asterisk server.' );
      }
    }
  }
}

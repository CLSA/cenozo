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

    if( 300 > $this->get_status()->get_code() )
    {
      // make sure we can connect to the voip server
      try
      {
        $voip_manager = lib::create( 'business\voip_manager' );
        $voip_manager->initialize();
      }
      catch( \cenozo\exception\base_exception $e )
      {
        $this->get_status()->set_code( 503 );
        $this->set_data( sprintf( '"%s"', $e->get_raw_message() ) );
      }
    }
  }
}

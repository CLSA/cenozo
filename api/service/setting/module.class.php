<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\setting;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\module
{
  /** 
   * Extend parent method
   */
  public function validate()
  {
    parent::validate();

    // check for role's all_site setting before viewing any settings
    $session = lib::create( 'business\session' );
    if( !$session->get_role()->all_sites )
    {
      $db_setting = $this->get_resource();
      if( $db_setting )
        if( $db_setting->site_id != $session->get_site()->id ) $this->get_status()->set_code( 403 );
    }
  }
}

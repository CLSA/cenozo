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
    // check for role's all_site setting before viewing any site
    $allowed = true;
    $session = lib::create( 'business\session' );
    if( !$session->get_role()->all_sites )
    {   
      $index = 0;
      while( $subject = $this->get_subject( $index ) ) 
      {   
        if( 'setting' == $subject )
        {   
          $allowed = $this->service->get_resource( $index )->site_id == $session->get_site()->id;
          break;
        }   

        $index++;
      }   
    }   

    return $allowed;
  }
}

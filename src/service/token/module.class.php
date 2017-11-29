<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\token;
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
    $valid = parent::validate();

    if( 300 > $this->get_status()->get_code() )
    {
      // make sure to only respond if the parent is a script
      if( 'script' != $this->get_parent_subject() ) $this->get_status()->set_code( 404 );
    }
  }
}

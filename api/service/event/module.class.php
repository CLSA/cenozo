<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\event;
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

    if( $valid )
    {
      // addresses can only be listed in the context of a participant
      $valid = 'participant' == $this->get_parent_subject();
    }

    return $valid;
  }
}

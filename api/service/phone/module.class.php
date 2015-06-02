<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\phone;
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
      // addresses can only be listed in the context of an alternate or participant
      $valid = in_array( $this->get_parent_subject(), array( 'alternate', 'participant' ) );
    }

    return $valid;
  }
}

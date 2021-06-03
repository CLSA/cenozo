<?php
/**
 * alternate_consent.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

class alternate_consent extends record
{
  /**
   * Returns a string representation of the alternate_consent (eg: verbal deny, written accept, etc)
   * @return string
   * @access public
   */
  public function to_string()
  {
    return sprintf( '%s %s %s',
                    $this->get_alternate_consent_type()->name,
                    $this->written ? 'written' : 'verbal',
                    $this->accept ? 'accept' : 'deny' );
  }
}

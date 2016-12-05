<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\callback;
use cenozo\lib, cenozo\log;

/**
 * Extends the base query class
 */
class query extends \cenozo\service\query
{
  /**
   * Extends parent method
   */
  public function get_subject( $index )
  {
    return 'participant';
  }

  /**
   * Extends parent method
   */
  public function prepare()
  {
    parent::prepare();

    // don't include participant who have no callbacks
    $this->modifier->where( 'participant.callback', '!=', NULL );
  }
}

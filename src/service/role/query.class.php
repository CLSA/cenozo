<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\role;
use cenozo\lib, cenozo\log;

/**
 * Extends parent class
 */
class query extends \cenozo\service\query
{
  /**
   * Extends parent method
   */
  protected function setup()
  {
    parent::setup();

    // if the request is for granting roles then restrict based on the user's role
    if( $this->get_argument( 'granting', false ) )
    {
      $db_role = lib::create( 'business\session' )->get_role();
      $this->modifier->where( 'tier', '<=', $db_role->tier );
      if( !$db_role->all_sites ) $this->modifier->where( 'all_sites', '=', false );
    }
  }
}

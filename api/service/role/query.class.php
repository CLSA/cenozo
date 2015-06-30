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
      $this->modifier->where( 'tier', '<=', lib::create( 'business\session' )->get_role()->tier );
  }
}

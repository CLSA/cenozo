<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\site;
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

    // if the request is for granting sites then restrict based on the user's role
    if( $this->get_argument( 'granting', false ) && !lib::create( 'business\session' )->get_role()->all_sites )
      $this->modifier->where( 'site.id', '=', lib::create( 'business\session' )->get_site()->id );
  }
}

<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\search;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\site_restricted_module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    // convert the query into a modifier
    $query = $this->get_argument( 'q', '' );

    if( 2 < strlen( $query ) )
    {
      lib::create( 'business\session' )->get_database()->search( $query );
      $modifier->where( 'query', '=', $query );
    }
    else
    {
      // purposefully return nothing
      $modifier->where( 'query', '=', NULL );
    }
  }
}

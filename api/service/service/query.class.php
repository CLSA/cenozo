<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\service;
use cenozo\lib, cenozo\log;

/**
 * Custom class for query requests
 */
class query extends \cenozo\service\query
{
  /**
   * TODO: document
   */
  protected function setup()
  {
    parent::setup();

    // include the user's role's services only
    if( !is_null( $this->get_argument( 'summary', NULL ) ) )
    {
      $db_role = lib::create( 'business\session' )->get_role();
      $this->modifier->join( 'role_has_service', 'service.id', 'role_has_service.service_id' );
      $this->modifier->where( 'role_has_service.role_id', '=', $db_role->id );
      $this->modifier->limit( NULL );
    }
  }

  /**
   * TODO: document
   */
  protected function execute()
  {
    parent::execute();

    if( !is_null( $this->get_argument( 'summary', NULL ) ) )
    {
      // transform data
      $results = array();
      foreach( $this->data['results'] as $service )
      {
        $method = $service['method'];
        if( !array_key_exists( $method, $results ) ) $results[$method] = array();
        $results[$method][] = $service['path'];
      }
      $this->data = $results;
    }
  }
}

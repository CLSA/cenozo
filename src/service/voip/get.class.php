<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\voip;
use cenozo\lib, cenozo\log;

/**
 * Special service for handling the get meta-resource
 */
class get extends \cenozo\service\service
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $path The URL of the service (not including the base)
   * @param array $args An associative array of arguments to be processed by the get operation.
   * @access public
   */
  public function __construct( $path, $args )
  {
    parent::__construct( 'GET', $path, $args );
  }

  /**
   * Override parent method since voip is a meta-resource
   */
  protected function create_resource( $index )
  {
    return array();
  }

  /**
   * Override parent method since voip is a meta-resource
   */
  public function execute()
  {
    $voip_manager = lib::create( 'business\voip_manager' );
    $this->set_data( array(
      'enabled' => $voip_manager->get_enabled(),
      'info' => $voip_manager->get_sip_enabled(),
      'call' => $voip_manager->get_call( lib::create( 'business\session' )->get_user() ) ) );
  }
}

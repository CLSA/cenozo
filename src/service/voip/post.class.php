<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\voip;
use cenozo\lib, cenozo\log;

/**
 * Special service for handling the post meta-resource (result)
 */
class post extends \cenozo\service\service
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $path The URL of the service (not including the base)
   * @param array $args An associative array of arguments to be processed by the post operation.
   * @param string $file The raw file posted by the request
   * @access public
   */
  public function __construct( $path, $args, $file )
  {
    parent::__construct( 'POST', $path, $args, $file );
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
  protected function execute()
  {
    $voip_manager = lib::create( 'business\voip_manager' );
    $session = lib::create( 'business\session' );

    $object = $this->get_file_as_object();
    $voip_call = $voip_manager->call( lib::create( 'database\phone', $object->phone_id ) );

    $this->set_data( $voip_call );
    $this->status->set_code( !is_null( $voip_call ) ? 201 : 202 );
  }
}

<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\self;
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
   * Override parent method since self is a meta-resource
   */
  protected function create_resource( $index )
  {
    $session = lib::create( 'business\session' );
    return array( 'application' => $session->get_application()->get_column_values() );
  }

  /**
   * Override parent method since self is a meta-resource
   */
  protected function execute()
  {
    $ldap_manager = lib::create( 'business\ldap_manager' );
    $session = lib::create( 'business\session' );

    $result = false;

    // check user credentials
    $headers = apache_request_headers();
    if( array_key_exists( 'Authorization', $headers ) )
    {
      $parts = explode( ' ', $headers['Authorization'] );
      if( 'Basic' == $parts[0] )
      {
        $auth = explode( ':', base64_decode( $parts[1] ) );
        if( 2 == count( $auth ) )
        {
          if( $ldap_manager->validate_user( $auth[0], $auth[1] ) )
          {
            $session->set_user( $auth[0] );
            $result = $session->set_site_and_role();
          }
        }
      }
    }

    $this->status->set_code( $result ? 201 : 202 );
  }
}

<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
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
    $session = lib::create( 'business\session' );

    $result = false;

    // check user credentials
    $user = NULL;
    $pass = NULL;
    if( $session->check_authorization_header( $user, $pass ) )
    {
      if( $session->login( $user ) )
      {
        $session->generate_new_jwt( $pass );
        $result = true;
      }
    }

    $this->status->set_code( $result ? 201 : 202 );
  }
}

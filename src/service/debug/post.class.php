<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\debug;
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
   * Override parent method since debug is a meta-resource
   */
  protected function create_resource( $index )
  {
    return NULL;
    /*
    $session = lib::create( 'business\session' );
    return array( 'application' => $session->get_application()->get_column_values() );
    */
  }

  /**
   * Override parent method since debug is a meta-resource
   */
  protected function execute()
  {
    log::warning( sprintf(
      "Remote client returned the following call stack as a result of a server-based HTTP error:\n%s",
      $this->get_file_as_raw()
    ) );
    
    $this->status->set_code( 201 );
  }
}

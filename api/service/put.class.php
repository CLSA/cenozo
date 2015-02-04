<?php
/**
 * put.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all put operations.
 */
class put extends base_resource
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $path The URL of the service (not including the base)
   * @param array $args An associative array of arguments to be processed by the put operation.
   * @param string $file The raw file posted by the request
   * @access public
   */
  public function __construct( $path, $args, $file )
  {
    parent::__construct( 'PUT', $path, $args, $file );
  }

  /**
   * TODO: document
   */
  protected function execute()
  {
    if( !is_null( $this->record ) )
    { // TODO: replace the record
    }
  }
}

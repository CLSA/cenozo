<?php
/**
 * options.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all options services
 */
class options extends service
{
  /**
   * Extends parent constructor
   */
  public function __construct( $path, $args = NULL )
  {
    parent::__construct( 'OPTIONS', $path, $args );
  }

  /**
   * Extends parent method
   */
  protected function prepare()
  {
    $this->headers['Access-Control-Allow-Methods'] = 'DELETE, GET, HEAD, OPTIONS, PATCH, POST';
    $this->headers['Access-Control-Allow-Headers'] = '*';
  }
}

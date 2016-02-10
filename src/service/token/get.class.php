<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\token;
use cenozo\lib, cenozo\log;

class get extends \cenozo\service\get
{
  /**
   * Override parent method
   */
  public function __construct( $path, $args = NULL, $file = NULL )
  {
    parent::__construct( $path, $args, $file );

    // token is a special case (because it is a limesurvey table)
    $this->status->set_code( 404 );
  }
}

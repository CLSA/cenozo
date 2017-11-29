<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\token;
use cenozo\lib, cenozo\log;

class patch extends \cenozo\service\patch
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

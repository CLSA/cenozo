<?php
/**
 * overview.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\business\overview;
use cenozo\lib, cenozo\log;

/**
 * overview: withdraw
 */
class interview extends \cenozo\business\overview\base_overview
{
  /**
   * Implements abstract method
   */
  protected function build()
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );
  }
}

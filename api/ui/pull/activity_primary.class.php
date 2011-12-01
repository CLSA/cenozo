<?php
/**
 * activity_primary.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\pull;
use cenozo\log, cenozo\util;

/**
 * pull: activity primary
 * 
 * @package cenozo\ui
 */
class activity_primary extends base_primary
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'activity', $args );
  }
}
?>

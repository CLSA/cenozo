<?php
/**
 * user_edit.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\log, cenozo\util;

/**
 * push: user edit
 *
 * Edit a user.
 * @package cenozo\ui
 */
class user_edit extends base_edit
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'user', $args );
  }
}
?>

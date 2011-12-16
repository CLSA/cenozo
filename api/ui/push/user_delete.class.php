<?php
/**
 * user_delete.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: user delete
 * 
 * @package cenozo\ui
 */
class user_delete extends base_delete
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
  
  /**
   * Executes the push.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function finish()
  {
    // warn the user to remove access before deleting user
    if( 0 < $this->get_record()->get_access_count() )
      throw lib::create( 'exception\notice',
        'You must delete all user access before the user can be deleted.', __METHOD__ );

    parent::finish();
  }
}
?>

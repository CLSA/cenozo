<?php
/**
 * self_set_role.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: self set_role
 * 
 * Changes the current user's role.
 * Arguments must include 'role'.
 */
class self_set_role extends \cenozo\ui\push
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'self', 'set_role', $args );
  }
  
  /**
   * This method executes the operation's purpose.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    $session = lib::create( 'business\session' );
    $db_site = $session->get_site();
    $db_role = lib::create( 'database\role', $this->get_argument( 'id' ) );
    $session->set_site_and_role( $db_site, $db_role );
  }
}
?>

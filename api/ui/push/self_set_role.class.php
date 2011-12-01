<?php
/**
 * self_set_role.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\log, cenozo\util;
use cenozo\business as bus;
use cenozo\database as db;
use cenozo\exception as exc;

/**
 * push: self set_role
 * 
 * Changes the current user's role.
 * Arguments must include 'role'.
 * @package cenozo\ui
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
   * Executes the push.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\runtime
   * @access public
   */
  public function finish()
  {
    try
    {
      $db_role = util::create( 'database\role', $this->get_argument( 'id' ) );
    } 
    catch( exc\runtime $e )
    {
      throw util::create( 'exception\argument', 'id', $this->get_argument( 'id' ), __METHOD__, $e );
    }
    
    $session = util::create( 'business\session' );
    $session->set_site_and_role( $session->get_site(), $db_role );
  }
}
?>

<?php
/**
 * self_set_role.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

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
   * @access protected
   */
  protected function finish()
  {
    try
    {
      $db_role = lib::create( 'database\role', $this->get_argument( 'id' ) );
    } 
    catch( \cenozo\exception\runtime $e )
    {
      throw lib::create( 'exception\argument', 'id', $this->get_argument( 'id' ), __METHOD__, $e );
    }
    
    $session = lib::create( 'business\session' );
    $session->set_site_and_role( $session->get_site(), $db_role );
  }
}
?>

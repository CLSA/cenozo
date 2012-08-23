<?php
/**
 * self_set_theme.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: self set_theme
 *
 * Changes the current user's theme.
 * Arguments must include 'theme'.
 */
class self_set_theme extends \cenozo\ui\push
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'self', 'set_theme', $args );
  }
  
  /**
   * This method executes the operation's purpose.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    $db_user = lib::create( 'business\session' )->get_user();
    $db_user->theme = $this->get_argument( 'theme' );
    $db_user->save();
  }
}
?>

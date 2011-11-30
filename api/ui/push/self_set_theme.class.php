<?php
/**
 * self_set_theme.class.php
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
 * push: self set_theme
 *
 * Changes the current user's theme.
 * Arguments must include 'theme'.
 * @package cenozo\ui
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
    $this->theme_name = $this->get_argument( 'theme' ); // must exist
  }
  
  /**
   * Executes the push.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function finish()
  {
    $session = util::create( 'business\\session' );
    $session->get_user()->theme = $this->theme_name;
    $session->get_user()->save();
  }

  /**
   * The name of the theme to set.
   * @var string
   * @access protected
   */
  protected $theme_name = NULL;
}
?>

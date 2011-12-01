<?php
/**
 * system_message_delete.class.php
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
 * push: system_message delete
 * 
 * @package cenozo\ui
 */
class system_message_delete extends base_delete
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'system_message', $args );
  }

  /**
   * Executes the push.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access public
   */
  public function finish()
  {
    // make sure that only top tier roles can remove system messages not belonging to the current site
    $session = util::create( 'business\session' );

    if( 3 != $session->get_role()->tier && $session->get_site()->id != $this->get_record()->site_id )
    {
      throw util::create( 'exception\notice',
        'You do not have access to remove this system message.', __METHOD__ );
    }

    parent::finish();
  }
}
?>

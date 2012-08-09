<?php
/**
 * system_message_delete.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: system_message delete
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
   * Validate the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    // make sure that only top tier roles can remove system messages not belonging to the
    // current site
    $session = lib::create( 'business\session' );

    if( 3 != $session->get_role()->tier &&
        $session->get_site()->id != $this->get_record()->site_id )
      throw lib::create( 'exception\notice',
        'You do not have access to remove this system message.', __METHOD__ );
  }
}
?>

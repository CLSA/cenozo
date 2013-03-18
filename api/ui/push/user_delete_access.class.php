<?php
/**
 * user_delete_access.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: user delete_access
 */
class user_delete_access extends base_delete_record
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'user', 'access', $args );
  }

  /**
   * Validate the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    // do not allow user's last access to be removed
    if( 1 == $this->get_record()->get_access_count() )
    {
      throw lib::create( 'exception\notice',
        'Cannot remove this user\'s only access.  If you wish to completely disable the user\'s '.
        'access set their active state to "No" instead.',
        __METHOD__ );
    }
  }
}

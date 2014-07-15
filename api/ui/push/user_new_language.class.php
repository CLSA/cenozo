<?php
/**
 * user_new_language.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: user new_language
 */
class user_new_language extends base_record
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @language public
   */
  public function __construct( $args )
  {
    parent::__construct( 'user', 'new_language', $args );
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

    $this->get_record()->add_language( $this->get_argument( 'id_list' ) );
  }
}

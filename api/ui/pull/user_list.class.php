<?php
/**
 * user_list.class.php
 * 
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\pull;
use cenozo\lib, cenozo\log;

/**
 * Class for user list pull operations.
 * 
 * @abstract
 * @package cenozo\ui
 */
class user_list extends base_list
{
  /**
   * Constructor
   * 
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'user', $args );
  }
}
?>

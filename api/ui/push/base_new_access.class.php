<?php
/**
 * base_new_access.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * Base class for all "new_access" push operations.
 */
abstract class base_new_access extends base_record
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The widget's subject.
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $subject, $args )
  {
    parent::__construct( $subject, 'new_access', $args );
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

    if( 'user' != $this->get_subject() && 'site' != $this->get_subject() )
      throw lib::create( 'exception\runtime',
        sprintf( 'Subject is "%s" but must be either site or user only.', $this->get_subject() ),
        __METHOD__ );
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

    $id_list = 'user' == $this->get_subject()
             ? $this->get_argument( 'site_id_list' )
             : $this->get_argument( 'user_id_list' );

    foreach( $this->get_argument( 'role_id_list' ) as $role_id )
      $this->get_record()->add_access( $id_list, $role_id );
  }
}

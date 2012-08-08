<?php
/**
 * access_list.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget access list
 */
class access_list extends site_restricted_list
{
  /**
   * Constructor
   * 
   * Defines all variables required by the access list.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'access', $args );
  }

  /**
   * Processes arguments, preparing them for the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();
    
    $this->add_column( 'user.name', 'string', 'User', true );
    $this->add_column( 'role.name', 'string', 'Role', true );
    $this->add_column( 'site.name', 'string', 'Site', true );
  }

  /**
   * Defines all rows in the list.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();
    
    foreach( $this->get_record_list() as $record )
    {
      $this->add_row( $record->id,
        array( 'user.name' => $record->get_user()->name,
               'role.name' => $record->get_role()->name,
               'site.name' => $record->get_site()->name ) );
    }
  }
}
?>

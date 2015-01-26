<?php
/**
 * system_message_add.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget system_message add
 */
class system_message_add extends base_view
{
  /**
   * Constructor
   * 
   * Defines all variables which need to be set for the associated template.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'system_message', 'add', $args );
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

    // define all columns defining this record

    $type = lib::create( 'business\session' )->get_role()->all_sites ? 'enum' : 'hidden';
    $this->add_item( 'site_id', $type, 'Site',
      'Leaving the site blank will show the message across all sites.' );
    $this->add_item( 'role_id', 'enum', 'Role',
      'Leaving the role blank will show the message to all roles.' );
    $this->add_item( 'title', 'string', 'Title' );
    $this->add_item( 'note', 'text', 'Note' );
  }

  /**
   * Defines all items in the view.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $site_class_name = lib::get_class_name( 'database\site' );
    $role_class_name = lib::get_class_name( 'database\role' );

    $session = lib::create( 'business\session' );
    $all_sites = $session->get_role()->all_sites;
    
    // create enum arrays
    if( $all_sites )
    {
      $sites = array();
      $site_mod = lib::create( 'database\modifier' );
      $site_mod->order( 'application_id' );
      $site_mod->order( 'name' );
      foreach( $site_class_name::select( $site_mod ) as $db_site )
        $sites[$db_site->id] = $db_site->get_full_name();
    }

    $roles = array();
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'tier', '<=', $session->get_role()->tier );
    foreach( $role_class_name::select( $modifier ) as $db_role )
      $roles[$db_role->id] = $db_role->name;

    // set the view's items
    $this->set_item(
      'site_id', $session->get_site()->id, false, $all_sites ? $sites : NULL );
    $this->set_item( 'role_id', null, false, $roles );
    $this->set_item( 'title', null, true );
    $this->set_item( 'note', null, true );
  }
}

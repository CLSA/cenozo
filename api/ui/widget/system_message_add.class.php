<?php
/**
 * system_message_add.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\log, cenozo\util;

/**
 * widget system_message add
 * 
 * @package cenozo\ui
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
    
    // define all columns defining this record

    $type = 3 == util::create( 'business\session' )->get_role()->tier ? 'enum' : 'hidden';
    $this->add_item( 'site_id', $type, 'Site',
      'Leaving the site blank will show the message across all sites.' );
    $this->add_item( 'role_id', 'enum', 'Role',
      'Leaving the role blank will show the message to all roles.' );
    $this->add_item( 'title', 'string', 'Title' );
    $this->add_item( 'note', 'text', 'Note' );
  }

  /**
   * Finish setting the variables in a widget.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function finish()
  {
    parent::finish();
    $session = util::create( 'business\session' );
    $is_top_tier = 3 == $session->get_role()->tier;
    $site_class_name = util::get_class_name( 'database\site' );
    $role_class_name = util::get_class_name( 'database\role' );
    
    // create enum arrays
    if( $is_top_tier )
    {
      $sites = array();
      foreach( $site_class_name::select() as $db_site ) $sites[$db_site->id] = $db_site->name;
    }

    $roles = array();
    $modifier = util::create( 'database\modifier' );
    if( !$is_top_tier ) $modifier->where( 'tier', '!=', 3 );
    foreach( $role_class_name::select( $modifier ) as $db_role )
      $roles[$db_role->id] = $db_role->name;

    // set the view's items
    $this->set_item(
      'site_id', $session->get_site()->id, false, $is_top_tier ? $sites : NULL );
    $this->set_item( 'role_id', null, false, $roles );
    $this->set_item( 'title', null, true );
    $this->set_item( 'note', null, true );

    $this->finish_setting_items();
  }
}
?>

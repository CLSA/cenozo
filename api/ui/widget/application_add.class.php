<?php
/**
 * application_add.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget application add
 */
class application_add extends base_view
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
    parent::__construct( 'application', 'add', $args );
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
    $this->add_item( 'name', 'string', 'Name',
                     'May only contain letters, numbers and underscores.' );
    $this->add_item( 'title', 'string', 'Title',
                     'A user-friendly name for the application, may contain any characters.' );
    $this->add_item( 'language_id', 'enum', 'Default Language' );
    $this->add_item( 'version', 'string', 'Version' );
    $this->add_item( 'release_based', 'boolean', 'Release Based' );
  }

  /**
   * Finish setting the variables in a widget.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();
    
    $language_class_name = lib::get_class_name( 'database\language' );

    $language_mod = lib::create( 'database\modifier' );
    $language_mod->where( 'active', '=', true );
    $language_mod->order( 'name' );
    $language_list = array();
    foreach( $language_class_name::select( $language_mod ) as $db_language )
      $language_list[$db_language->id] = $db_language->name;
    
    // set the view's items
    $this->set_item( 'name', '' );
    $this->set_item( 'title', '' );
    $this->set_item( 'language_id', key( $language_list ), true, $language_list );
    $this->set_item( 'version', '' );
    $this->set_item( 'release_based', false );
  }
}

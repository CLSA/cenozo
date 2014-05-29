<?php
/**
 * region_site_view.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget region_site view
 */
class region_site_view extends base_view
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
    parent::__construct( 'region_site', 'view', $args );
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

    $this->add_item( 'service_id', 'hidden', 'Service' );
    $this->add_item( 'region_id', 'enum', 'Region' );
    $this->add_item( 'language_id', 'enum', 'Language' );
    $this->add_item( 'site_id', 'enum', 'Site' );
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

    $region_class_name = lib::get_class_name( 'database\region' );
    $site_class_name = lib::get_class_name( 'database\site' );
    $language_class_name = lib::get_class_name( 'database\language' );

    // create enum arrays
    $regions = array();
    $region_mod = lib::create( 'database\modifier' );
    $region_mod->order( 'country' );
    $region_mod->order( 'name' );
    foreach( $region_class_name::select( $region_mod ) as $db_region )
      $regions[$db_region->id] = $db_region->name;

    $sites = array();
    $site_mod = lib::create( 'database\modifier' );
    $site_mod->where( 'service_id', '=', $this->get_record()->service_id );
    $site_mod->order( 'name' );
    foreach( $site_class_name::select( $site_mod ) as $db_site )
      $sites[$db_site->id] = $db_site->name;
    
    $languages = array();
    $language_mod = lib::create( 'database\modifier' );
    $language_mod->where( 'active', '=', true );
    $language_mod->order( 'name' );
    foreach( $language_class_name::select( $language_mod ) as $db_language )
      $languages[$db_language->id] = $db_language->name;
    
    // set the view's items
    $this->set_item( 'service_id', $this->get_record()->service_id );
    $this->set_item( 'region_id', $this->get_record()->region_id, true, $regions );
    $this->set_item( 'language_id', $this->get_record()->language_id, true, $languages );
    $this->set_item( 'site_id', $this->get_record()->site_id, true, $sites );
  }
}

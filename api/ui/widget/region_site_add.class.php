<?php
/**
 * region_site_add.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget region_site add
 */
class region_site_add extends base_view
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
    parent::__construct( 'region_site', 'add', $args );
  }

  protected function validate()
  {
    parent::validate();

    // this widget must have a parent, and it's subject must be service
    if( is_null( $this->parent ) || 'service' != $this->parent->get_subject() )
      throw lib::create( 'exception\runtime',
        'Region_site widget must have a parent with service as the subject.', __METHOD__ );
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
    
    // specify in the heading which service this region_site belongs to
    $this->set_heading(
      sprintf( 'Add a new association between a region and site for %s',
               $this->parent->get_record()->title ) );

    $this->add_item( 'service_id', 'hidden' );
    $this->add_item( 'region_id', 'enum', 'Region' );
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

    $db_service = $this->parent->get_record();

    // create enum arrays
    $regions = array();
    $region_mod = lib::create( 'database\modifier' );
    $region_mod->order( 'country' );
    $region_mod->order( 'name' );
    foreach( $region_class_name::select( $region_mod ) as $db_region )
      $regions[$db_region->id] = $db_region->name;

    $sites = array();
    $site_mod = lib::create( 'database\modifier' );
    $site_mod->where( 'service_id', '=', $db_service->id );
    $site_mod->order( 'name' );
    foreach( $site_class_name::select( $site_mod ) as $db_site )
      $sites[$db_site->id] = $db_site->name;
    
    // set the view's items
    $this->set_item( 'service_id', $db_service->id );
    $this->set_item( 'region_id', key( $regions ), true, $regions );
    $this->set_item( 'site_id', key( $sites ), true, $sites );
  }
}

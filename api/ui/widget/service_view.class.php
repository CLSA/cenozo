<?php
/**
 * service_view.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget service view
 */
class service_view extends base_view
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
    parent::__construct( 'service', 'view', $args );
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

    // create an associative array with everything we want to display about the service
    $this->add_item( 'name', 'string', 'Name',
                     'May only contain letters, numbers and underscores.' );
    $this->add_item( 'title', 'string', 'Title',
                     'A user-friendly name for the service, may contain any characters.' );
    $this->add_item( 'version', 'string', 'Version' );
    $this->add_item( 'sites', 'constant', 'Sites' );
    $this->add_item( 'release_based', 'boolean', 'Release Based' );

    // create the cohort sub-list widget
    $this->cohort_list = lib::create( 'ui\widget\cohort_list', $this->arguments );
    $this->cohort_list->set_parent( $this );

    // create the role sub-list widget
    $this->role_list = lib::create( 'ui\widget\role_list', $this->arguments );
    $this->role_list->set_parent( $this );

    // create the site sub-list widget
    $this->site_list = lib::create( 'ui\widget\site_list', $this->arguments );
    $this->site_list->set_parent( $this );

    // create the region_site sub-list widget
    $this->region_site_list = lib::create( 'ui\widget\region_site_list', $this->arguments );
    $this->region_site_list->set_parent( $this );
    $this->region_site_list->set_heading( 'Region-Site Associations' );
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

    $cohort_class_name = lib::get_class_name( 'database\cohort' );
    $record = $this->get_record();

    // set the view's items
    $this->set_item( 'name', $record->name );
    $this->set_item( 'title', $record->title );
    $this->set_item( 'version', $record->version );
    $this->set_item( 'sites', $record->get_site_count() );
    $this->set_item( 'release_based', $record->release_based );

    try
    {
      $this->cohort_list->process();
      $this->set_variable( 'cohort_list', $this->cohort_list->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}

    try
    {
      $this->role_list->process();
      $this->set_variable( 'role_list', $this->role_list->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}

    try
    {
      $this->site_list->process();
      $this->set_variable( 'site_list', $this->site_list->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}

    try
    {
      $this->region_site_list->process();
      $this->set_variable( 'region_site_list', $this->region_site_list->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}
  }

  /**
   * The cohort list widget.
   * @var cohort_list
   * @access protected
   */
  protected $cohort_list = NULL;

  /**
   * The role list widget.
   * @var role_list
   * @access protected
   */
  protected $role_list = NULL;

  /**
   * The site list widget.
   * @var site_list
   * @access protected
   */
  protected $site_list = NULL;

  /**
   * The region_site list widget.
   * @var region_site_list
   * @access protected
   */
  protected $region_site_list = NULL;
}

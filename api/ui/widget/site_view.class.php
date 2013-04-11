<?php
/**
 * site_view.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget site view
 */
class site_view extends base_view
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
    parent::__construct( 'site', 'view', $args );
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

    // create an associative array with everything we want to display about the site
    $this->add_item( 'service_id', 'constant', 'Service' );
    $this->add_item( 'name', 'string', 'Name' );
    $this->add_item( 'timezone', 'enum', 'Time Zone' );
    $this->add_item( 'title', 'string', 'Institution' );
    $this->add_item( 'phone_number', 'string', 'Phone Number' );
    $this->add_item( 'address1', 'string', 'Address1' );
    $this->add_item( 'address2', 'string', 'Address2' );
    $this->add_item( 'city', 'string', 'City' );
    $this->add_item( 'region_id', 'enum', 'Region' );
    $this->add_item( 'postcode', 'string', 'Postcode',
      'Postal codes must be in "A1A 1A1" format, zip codes in "01234" format.' );
    $this->add_item( 'users', 'constant', 'Number of users' );
    $this->add_item( 'last_activity', 'constant', 'Last activity' );

    // create the access sub-list widget
    $this->access_list = lib::create( 'ui\widget\access_list', $this->arguments );
    $this->access_list->set_parent( $this );
    $this->access_list->set_heading( 'Site access list' );

    // create the activity sub-list widget
    $this->activity_list = lib::create( 'ui\widget\activity_list', $this->arguments );
    $this->activity_list->set_parent( $this );
    $this->activity_list->set_heading( 'Site activity' );
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
    
    $util_class_name = lib::get_class_name( 'util' );
    $record = $this->get_record();

    // create enum arrays
    $site_class_name = lib::get_class_name( 'database\site' );
    $timezones = $site_class_name::get_enum_values( 'timezone' );
    $timezones = array_combine( $timezones, $timezones );

    $region_mod = lib::create( 'database\modifier' );
    $region_mod->order( 'country' );
    $region_mod->order( 'name' );
    $regions = array();
    $region_class_name = lib::get_class_name( 'database\region' );
    foreach( $region_class_name::select( $region_mod ) as $db_region )
      $regions[$db_region->id] = $db_region->name.', '.$db_region->country;
    reset( $regions );

    // set the view's items
    $this->set_item( 'service_id', $record->get_service()->name );
    $this->set_item( 'name', $record->name, true );
    $this->set_item( 'timezone', $record->timezone, true, $timezones );
    $this->set_item( 'title', $this->get_record()->title );
    $this->set_item( 'phone_number', $this->get_record()->phone_number );
    $this->set_item( 'address1', $this->get_record()->address1 );
    $this->set_item( 'address2', $this->get_record()->address2 );
    $this->set_item( 'city', $this->get_record()->city );
    $this->set_item( 'region_id', $this->get_record()->region_id, false, $regions );
    $this->set_item( 'postcode', $this->get_record()->postcode, true );
    $this->set_item( 'users', $record->get_user_count() );

    $db_activity = $record->get_last_activity();
    $last = $util_class_name::get_fuzzy_period_ago(
              is_null( $db_activity ) ? null : $db_activity->datetime );
    $this->set_item( 'last_activity', $last );

    // process the child widgets
    try
    {
      $this->access_list->process();
      $this->set_variable( 'access_list', $this->access_list->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}

    try
    {
      $this->activity_list->process();
      $this->set_variable( 'activity_list', $this->activity_list->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}
  }

  /**
   * Overrides the access list widget's method to only include this site's access.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return int
   * @access protected
   */
  public function determine_access_count( $modifier = NULL )
  {
    $access_class_name = lib::get_class_name( 'database\access' );
    if( NULL == $modifier ) $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'access.site_id', '=', $this->get_record()->id );
    return $access_class_name::count( $modifier );
  }

  /**
   * Overrides the access list widget's method to only include this site's access.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return array( record )
   * @access protected
   */
  public function determine_access_list( $modifier = NULL )
  {
    $access_class_name = lib::get_class_name( 'database\access' );
    if( NULL == $modifier ) $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'access.site_id', '=', $this->get_record()->id );
    return $access_class_name::select( $modifier );
  }

  /**
   * Overrides the activity list widget's method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return int
   * @access protected
   */
  public function determine_activity_count( $modifier = NULL )
  {
    return $this->get_record()->get_activity_count( $modifier );
  }

  /**
   * Overrides the activity list widget's method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return array( record )
   * @access protected
   */
  public function determine_activity_list( $modifier = NULL )
  {
    return $this->get_record()->get_activity_list( $modifier );
  }

  /**
   * The access list widget.
   * @var access_list
   * @access protected
   */
  protected $access_list = NULL;

  /**
   * The activity list widget.
   * @var activity_list
   * @access protected
   */
  protected $activity_list = NULL;
}

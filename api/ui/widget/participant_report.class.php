<?php
/**
 * participant_report.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget participant report
 */
class participant_report extends \cenozo\ui\widget\base_report
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
    parent::__construct( 'participant', $args );
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

    $service_class_name = lib::get_class_name( 'database\service' );

    $this->add_restriction( 'source' );
    $this->add_restriction( 'cohort' );
    $this->add_parameter( 'active', 'boolean', 'Active' );
    foreach( $service_class_name::select() as $db_service )
    {
      if( $db_service->get_site_count() )
      { // don't include services without sites
        $this->add_parameter(
          $db_service->name.'_site_id', 'enum', $db_service->name.' Site' );
        $this->add_parameter(
          $db_service->name.'_released', 'boolean', 'Released to '.$db_service->name );
      }
    }
    $this->add_parameter( 'region_id', 'enum', 'Region' );
    $this->add_parameter( 'gender', 'enum', 'Gender' );
    $this->add_parameter( 'age_group_id', 'enum', 'Age Group' );
    $this->add_parameter( 'date_of_birth_start_date', 'date', 'Date of Birth Start Date' );
    $this->add_parameter( 'date_of_birth_end_date', 'date', 'Date of Birth End Date' );
    $this->add_parameter( 'status', 'enum', 'Status' );
    $this->add_parameter( 'language', 'enum', 'Language' );
    $this->add_parameter( 'consent_accept', 'boolean', 'Consent Accepted' );
    $this->add_parameter( 'consent_written', 'boolean', 'Written Consent' );
    $this->add_parameter( 'event_id', 'enum', 'Event' );
    $this->add_parameter( 'event_start_date', 'date', 'Event Start Date' );
    $this->add_parameter( 'event_end_date', 'date', 'Event End Date' );
    $this->add_parameter( 'phone_count', 'number', 'Phone Count' );
    $this->add_parameter( 'address_count', 'number', 'Address Count' );
    
    $this->set_variable( 'description',
      'This report provides a list of participants based on any of the provided restrictions.' );
  }

  /**
   * Sets up the operation with any pre-execution instructions that may be necessary.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $service_class_name = lib::get_class_name( 'database\service' );
    $region_class_name = lib::get_class_name( 'database\region' );
    $age_group_class_name = lib::get_class_name( 'database\age_group' );
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $event_class_name = lib::get_class_name( 'database\event' );

    // create the enum lists
    $region_mod = lib::create( 'database\modifier' );
    $region_mod->order( 'name' );
    $region_mod->where( 'country', '=', 'Canada' );
    $region_list = array();
    foreach( $region_class_name::select( $region_mod ) as $db_region )
      $region_list[$db_region->id] = $db_region->name;

    $gender_list = array( 'female' => 'Female', 'male' => 'Male' );

    $age_group_mod = lib::create( 'database\modifier' );
    $age_group_mod->order( 'lower' );
    $age_group_list = array();
    foreach( $age_group_class_name::select( $age_group_mod ) as $db_age_group )
      $age_group_list[$db_age_group->id] = $db_age_group->to_string();

    $status_list = $participant_class_name::get_enum_values( 'status' );
    array_unshift( $status_list, 'any' );
    array_unshift( $status_list, 'none' );
    $status_list = array_combine( $status_list, $status_list );

    $language_list = $participant_class_name::get_enum_values( 'language' );
    $language_list = array_combine( $language_list, $language_list );

    $event_mod = lib::create( 'database\modifier' );
    $event_mod->order( 'name' );
    $event_list = array();
    foreach( $event_class_name::select( $event_mod ) as $db_event )
      $event_list[$db_event->id] = $db_event->name;

    $this->set_parameter( 'active', NULL, false );
    foreach( $service_class_name::select() as $db_service )
    {
      $site_mod = lib::create( 'database\modifier' );
      $site_mod->order( 'name' );
      $site_list = array();
      foreach( $db_service->get_site_list( $site_mod ) as $db_site )
        $site_list[$db_site->id] = $db_site->name;

      if( count( $site_list ) )
      { // don't include services without sites
        $this->set_parameter( $db_service->name.'_site_id', NULL, false, $site_list );
        $this->set_parameter( $db_service->name.'_released', NULL, false );
      }
    }
    $this->set_parameter( 'region_id', NULL, false, $region_list );
    $this->set_parameter( 'gender', NULL, false, $gender_list );
    $this->set_parameter( 'age_group_id', NULL, false, $age_group_list );
    $this->set_parameter( 'date_of_birth_start_date', NULL, false );
    $this->set_parameter( 'date_of_birth_end_date', NULL, false );
    $this->set_parameter( 'status', NULL, false, $status_list );
    $this->set_parameter( 'language', NULL, false, $language_list );
    $this->set_parameter( 'consent_accept', NULL, false );
    $this->set_parameter( 'consent_written', NULL, false );
    $this->set_parameter( 'event_id', NULL, false, $event_list );
    $this->set_parameter( 'event_start_date', NULL, false );
    $this->set_parameter( 'event_end_date', NULL, false );
    $this->set_parameter( 'phone_count', NULL, false );
    $this->set_parameter( 'address_count', NULL, false );
  }
}

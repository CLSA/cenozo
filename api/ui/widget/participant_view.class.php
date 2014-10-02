<?php
/**
 * participant_view.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget participant view
 */
class participant_view extends base_view
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
    parent::__construct( 'participant', 'view', $args );
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
    
    // create an associative array with everything we want to display about the participant
    $this->add_item( 'active', 'boolean', 'Active' );
    $this->add_item( 'uid', 'constant', 'Unique ID' );
    $this->add_item( 'source', 'constant', 'Source' );
    $this->add_item( 'cohort', 'constant', 'Cohort' );
    $this->add_item( 'first_name', 'string', 'First Name' );
    $this->add_item( 'other_name', 'string', 'Other/Nickname' );
    $this->add_item( 'last_name', 'string', 'Last Name' );
    $this->add_item( 'language_id', 'enum', 'Preferred Language' );

    // add an item for default and preferred sites for all services the participant's cohort
    // belongs to
    $service_list = $this->get_record()->get_cohort()->get_service_list();
    foreach( $service_list as $db_service )
    {
      $title_postfix = 1 < count( $service_list ) ? sprintf( ' (%s)', $db_service->name ) : '';
      $this->add_item(
        sprintf( '%s_default_site', $db_service->name ),
        'constant',
        'Default Site'.$title_postfix );
      $this->add_item(
        sprintf( '%s_site_id', $db_service->name ),
        'enum',
        'Preferred Site'.$title_postfix );
    }

    $this->add_item( 'email', 'string', 'Email', 'Must be in the format "account@domain.name"' );
    $this->add_item( 'email_do_not_contact', 'boolean', 'Do not send email',
      'Whether the participant has asked to be excluded from mass emails.' );
    $this->add_item( 'gender', 'enum', 'Gender' );
    $this->add_item( 'date_of_birth', 'date', 'Date of Birth' );
    $this->add_item( 'age_group_id', 'enum', 'Age Group' );
    $this->add_item( 'state_id', 'enum', 'Condition' );
    $this->add_item( 'withdraw_option', 'constant', 'Withdraw Option' );
    $this->add_item( 'override_quota', 'boolean', 'Override Quota' );

    // create the address sub-list widget
    $this->address_list = lib::create( 'ui\widget\address_list', $this->arguments );
    $this->address_list->set_parent( $this );
    $this->address_list->set_heading( 'Addresses' );

    // create the phone sub-list widget
    $this->phone_list = lib::create( 'ui\widget\phone_list', $this->arguments );
    $this->phone_list->set_parent( $this );
    $this->phone_list->set_heading( 'Phone numbers' );

    // create the availability sub-list widget
    $this->availability_list = lib::create( 'ui\widget\availability_list', $this->arguments );
    $this->availability_list->set_parent( $this );
    $this->availability_list->set_heading( 'Availability' );

    // create the consent sub-list widget
    $this->consent_list = lib::create( 'ui\widget\consent_list', $this->arguments );
    $this->consent_list->set_parent( $this );
    $this->consent_list->set_heading( 'Consent information' );

    // create the alternate sub-list widget
    $this->alternate_list = lib::create( 'ui\widget\alternate_list', $this->arguments );
    $this->alternate_list->set_parent( $this );
    $this->alternate_list->set_heading( 'Alternate contacts' );

    // create the event sub-list widget
    $this->event_list = lib::create( 'ui\widget\event_list', $this->arguments );
    $this->event_list->set_parent( $this );
    $this->event_list->set_heading( 'Events' );
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

    $participant_class_name = lib::get_class_name( 'database\participant' );
    $state_class_name = lib::get_class_name( 'database\state' );
    $age_group_class_name = lib::get_class_name( 'database\age_group' );
    $operation_class_name = lib::get_class_name( 'database\operation' );
    $language_class_name = lib::get_class_name( 'database\language' );

    // create enum arrays
    $genders = $participant_class_name::get_enum_values( 'gender' );
    $genders = array_combine( $genders, $genders );
    $languages = array();
    $language_mod = lib::create( 'database\modifier' );
    $language_mod->where( 'active', '=', true );
    $language_mod->order( 'name' );
    foreach( $language_class_name::select( $language_mod ) as $db_language )
      $languages[$db_language->id] = $db_language->name;
    $states = array();
    $state_mod = lib::create( 'database\modifier' );
    $state_mod->order( 'rank' );
    foreach( $state_class_name::select( $state_mod ) as $db_state )
      $states[$db_state->id] = $db_state->name;
    $age_groups = array();
    $age_group_mod = lib::create( 'database\modifier' );
    $age_group_mod->order( 'lower' );
    foreach( $age_group_class_name::select( $age_group_mod ) as $db_age_group )
      $age_groups[$db_age_group->id] = $db_age_group->to_string();

    $record = $this->get_record();
    $db_age_group = $record->get_age_group();

    $withdraw_option = 'Not withdrawn';
    if( !is_null( $record->withdraw_letter ) )
    {
      if( in_array( $record->withdraw_letter, array( 'a', 'b', 'c', 'd' ) ) )
        $withdraw_option = 'Withdrawn: Option #1';
      else if( in_array( $record->withdraw_letter, array( 'e', 'f', 'g', 'h' ) ) )
        $withdraw_option = 'Withdrawn: Option #2';
      else if( in_array( $record->withdraw_letter, array( 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p' ) ) )
        $withdraw_option = 'Withdrawn: Option #3';
      else if( in_array( $record->withdraw_letter, array( 'q', 'r', 's', 't' ) ) )
        $withdraw_option = 'Withdrawn: Option #4';
      else if( '0' == $record->withdraw_letter )
        $withdraw_option = 'Withdrawn: no option (data never provided)';
      else
        $withdraw_option = 'Withdrawn: unknown option';
    }

    // set the view's items
    $this->set_item( 'active', $record->active, true );
    $this->set_item( 'uid', $record->uid, true );
    $this->set_item( 'cohort', $record->get_cohort()->name );
    $this->set_item( 'source', $record->get_source()->name );
    $this->set_item( 'first_name', $record->first_name );
    $this->set_item( 'other_name', $record->other_name );
    $this->set_item( 'last_name', $record->last_name );
    $this->set_item( 'language_id', $record->language_id, false, $languages );
    $this->set_item( 'state_id', $record->state_id, false, $states );
    $this->set_item( 'withdraw_option', $withdraw_option );
    $this->set_item( 'override_quota', $record->override_quota, true );

    // set items for default and preferred sites for all services the participant's cohort
    // belongs to
    foreach( $this->get_record()->get_cohort()->get_service_list() as $db_service )
    {
      $sites = array();
      $site_mod = lib::create( 'database\modifier' );
      $site_mod->order( 'service_id' );
      $site_mod->order( 'name' );
      foreach( $db_service->get_site_list( $site_mod ) as $db_site )
        $sites[$db_site->id] = $db_site->name;

      $db_default_site = $record->get_default_site( $db_service );
      $this->set_item(
        sprintf( '%s_default_site', $db_service->name ),
        is_null( $db_default_site ) ? '(none)' : $db_default_site->name );
      $db_preferred_site = $record->get_preferred_site( $db_service );
      $this->set_item(
        sprintf( '%s_site_id', $db_service->name ),
        is_null( $db_preferred_site ) ? '' : $db_preferred_site->id, false, $sites );
    }

    $this->set_item( 'email', $record->email, false );
    $this->set_item( 'email_do_not_contact', $record->email_do_not_contact, true );
    $this->set_item( 'gender', $record->gender, true, $genders );
    $this->set_item( 'date_of_birth', $record->date_of_birth );
    $this->set_item(
      'age_group_id', is_null( $db_age_group ) ? NULL : $db_age_group->id, false, $age_groups );

    try
    {
      $this->address_list->process();
      $this->set_variable( 'address_list', $this->address_list->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}

    try
    {
      $this->phone_list->process();
      $this->set_variable( 'phone_list', $this->phone_list->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}

    try
    {
      $this->availability_list->process();
      $this->set_variable( 'availability_list', $this->availability_list->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}

    try
    {
      $this->consent_list->process();
      $this->set_variable( 'consent_list', $this->consent_list->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}

    try
    {
      $this->alternate_list->process();
      $this->set_variable( 'alternate_list', $this->alternate_list->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}

    try
    {
      $this->event_list->process();
      $this->set_variable( 'event_list', $this->event_list->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}

    // add an delink action
    $db_operation = $operation_class_name::get_operation( 'push', 'participant', 'delink' );
    if( lib::create( 'business\session' )->is_allowed( $db_operation ) )
    {
      $this->set_variable( 'allow_delink', true );
      $this->add_action( 'delink', 'De-Link', NULL,
        'Permanently removes the link between a participant and their current unique identifier.' );
    }
    else $this->set_variable( 'allow_delink', true );

    // add an hin action
    $db_operation = $operation_class_name::get_operation( 'widget', 'participant', 'hin' );
    if( lib::create( 'business\session' )->is_allowed( $db_operation ) )
      $this->add_action( 'hin', 'HIN', $db_operation,
        'Edit the participant\'s health insurance number.' );
  }

  /**
   * The address list widget.
   * @var address_list
   * @access protected
   */
  protected $address_list = NULL;
  
  /**
   * The phone list widget.
   * @var phone_list
   * @access protected
   */
  protected $phone_list = NULL;
  
  /**
   * The availability list widget.
   * @var availability_list
   * @access protected
   */
  protected $availability_list = NULL;
  
  /**
   * The consent list widget.
   * @var consent_list
   * @access protected
   */
  protected $consent_list = NULL;
  
  /**
   * The alternate contact person list widget.
   * @var alternate_list
   * @access protected
   */
  protected $alternate_list = NULL;
  
  /**
   * The event contact person list widget.
   * @var event_list
   * @access protected
   */
  protected $event_list = NULL;
}

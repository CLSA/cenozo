<?php
/**
 * participant_add.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget participant add
 */
class participant_add extends base_view
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
    parent::__construct( 'participant', 'add', $args );
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

    $database_class_name = lib::get_class_name( 'database\participant' );
    $this->new_uid = $database_class_name::get_new_uid();
    
    // define all columns defining this record
    $this->add_item( 'active', 'boolean', 'Active' );
    $this->add_item( 'uid', is_null( $this->new_uid ) ? 'string' : 'hidden', 'Unique ID' );
    $this->add_item( 'source_id', 'enum', 'Source' );
    $this->add_item( 'cohort', 'enum', 'Cohort' );
    $this->add_item( 'first_name', 'string', 'First Name' );
    $this->add_item( 'last_name', 'string', 'Last Name' );
    $this->add_item( 'gender', 'enum', 'Gender' );
    $this->add_item( 'date_of_birth', 'date', 'Date of Birth' );
    $this->add_item( 'language_id', 'enum', 'Preferred Language' );
    $this->add_item( 'email', 'string', 'Email', 'Must be in the format "account@domain.name"' );
    $this->add_item( 'state_id', 'enum', 'Condition' );
    $this->add_item( 'person_id', 'hidden' );
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
    
    // create enum arrays
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $state_class_name = lib::get_class_name( 'database\state' );
    $source_class_name = lib::get_class_name( 'database\source' );
    $cohort_class_name = lib::get_class_name( 'database\cohort' );
    $language_class_name = lib::get_class_name( 'database\language' );

    $sources = array();
    foreach( $source_class_name::select() as $db_source )
      $sources[$db_source->id] = $db_source->name;
    $cohorts = array();
    foreach( $cohort_class_name::select() as $db_cohort )
      $cohorts[$db_cohort->id] = $db_cohort->name;
    $genders = $participant_class_name::get_enum_values( 'gender' );
    $genders = array_combine( $genders, $genders );
    $languages = array();
    $language_mod = lib::create( 'database\modifier' );
    $language_mod->where( 'active', '=', true );
    $language_mod->order( 'name' );
    foreach( $language_class_name::select( $language_mod ) as $db_language )
      $languages[$db_language->id] = $db_language->name;

    $state_mod = lib::create( 'database\modifier' );
    $state_mod->order( 'rank' );
    $state_list = array();
    foreach( $state_class_name::select( $state_mod ) as $db_state )
      $state_list[$db_state->id] = $db_state->name;
    
    $sites = array();
    $site_class_name = lib::get_class_name( 'database\site' );
    $site_mod = lib::create( 'database\modifier' );
    $site_mod->order( 'service_id' );
    $site_mod->order( 'name' );
    foreach( $site_class_name::select( $site_mod ) as $db_site ) 
      $sites[$db_site->id] = $db_site->get_full_name();

    // set the view's items
    $this->set_item( 'active', true, true );
    $this->set_item( 'uid', is_null( $this->new_uid ) ? '' : $this->new_uid, true );
    $this->set_item( 'source_id', key( $sources ), false, $sources );
    $this->set_item( 'cohort', key( $cohorts ), true, $cohorts );
    $this->set_item( 'first_name', '', true );
    $this->set_item( 'last_name', '', true );
    $this->set_item( 'gender', key( $genders ), true, $genders );
    $this->set_item( 'date_of_birth', '' );
    $this->set_item( 'language_id',
      lib::create( 'business\session' )->get_service()->language_id, false, $languages );
    $this->set_item( 'email', '' );
    $this->set_item( 'state_id', '', false, $state_list );
    // this particular entry is filled in by the push/participant_new operation
    $this->set_item( 'person_id', 0 );
  }

  /**
   * The unique identifier to assign to the participant, or null if none are available.
   * @var string
   * @access protected
   */
  protected $new_uid = NULL;
}

<?php
/**
 * participant_multiedit.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget participant multiedit
 */
class participant_multiedit extends \cenozo\ui\widget\base_participant_multi
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
    parent::__construct( 'multiedit', $args );
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

    $this->add_parameter( 'active', 'enum', 'Active' );
    $this->add_parameter( 'gender', 'enum', 'Gender' );
    $this->add_parameter( 'age_group_id', 'enum', 'Age Group' );
    $this->add_parameter( 'state_id', 'enum', 'Condition' );
    $this->add_parameter( 'language', 'enum', 'Language' );
    $this->add_parameter( 'override_quota', 'enum', 'Override Quota' );
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

    $participant_class_name = lib::get_class_name( 'database\participant' );
    $state_class_name = lib::get_class_name( 'database\state' );
    $age_group_class_name = lib::get_class_name( 'database\age_group' );

    // define all enum values
    $base_list = array( 'dnc' => 'do not change' );

    $active_list = $base_list;
    $active_list['y'] = 'Yes';
    $active_list['n'] = 'No';

    $gender_list = $participant_class_name::get_enum_values( 'gender' );
    $gender_list = array_combine( $gender_list, $gender_list );
    $gender_list = array_merge( $base_list, $gender_list );
    
    $age_group_mod = lib::create( 'database\modifier' );
    $age_group_mod->order( 'lower' );
    $age_group_list = $base_list;
    foreach( $age_group_class_name::select( $age_group_mod ) as $db_age_group )
      $age_group_list[$db_age_group->id] = $db_age_group->to_string();
    
    $state_mod = lib::create( 'database\modifier' );
    $state_mod->order( 'rank' );
    $state_list = $base_list;
    foreach( $state_class_name::select( $state_mod ) as $db_state )
      $state_list[$db_state->id] = $db_state->name;

    $language_list = $participant_class_name::get_enum_values( 'language' );
    $language_list = array_combine( $language_list, $language_list );
    $language_list[''] = '';
    $language_list = array_merge( $base_list, $language_list );

    $override_quota_list = $base_list;
    $override_quota_list['y'] = 'Yes';
    $override_quota_list['n'] = 'No';

    $this->set_parameter( 'active', current( $active_list ), true, $active_list );
    $this->set_parameter( 'gender', current( $gender_list ), true, $gender_list );
    $this->set_parameter( 'age_group_id', current( $age_group_list ), true, $age_group_list );
    $this->set_parameter( 'state_id', current( $state_list ), true, $state_list );
    $this->set_parameter( 'language', current( $language_list ), true, $language_list );
    $this->set_parameter(
      'override_quota', current( $override_quota_list ), true, $override_quota_list );
  }
}

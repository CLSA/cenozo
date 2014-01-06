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
class participant_multiedit extends \cenozo\ui\widget
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
    parent::__construct( 'participant', 'multiedit', $args );
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

    // define all template variables for this widget
    $gender_list = $participant_class_name::get_enum_values( 'gender' );
    $gender_list = array_combine( $gender_list, $gender_list );
    $this->set_variable( 'gender_list', $gender_list );
    
    $age_group_mod = lib::create( 'database\modifier' );
    $age_group_mod->order( 'lower' );
    $age_group_list = array();
    foreach( $age_group_class_name::select( $age_group_mod ) as $db_age_group )
      $age_group_list[$db_age_group->id] = $db_age_group->to_string();
    $this->set_variable( 'age_group_list', $age_group_list );
    
    $state_mod = lib::create( 'database\modifier' );
    $state_mod->order( 'rank' );
    $state_list = array();
    foreach( $state_class_name::select( $state_mod ) as $db_state )
      $state_list[$db_state->id] = $db_state->name;

    $language_list = $participant_class_name::get_enum_values( 'language' );
    $language_list = array_combine( $language_list, $language_list );
    $language_list[''] = '';
    $this->set_variable( 'language_list', $language_list );
  }
}

<?php
/**
 * email_report.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget email report
 */
class email_report extends \cenozo\ui\widget\base_report
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
    parent::__construct( 'email', $args );
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

    $participant_class_name = lib::get_class_name( 'database\participant' );

    $this->add_parameter( 'language', 'enum', 'Language' );
    $this->add_restriction( 'dates' );
    $this->add_parameter( 'type', 'enum', 'Type' );

    $this->set_variable( 'description',
      'This report provides a list of all participants who last changed their email address '.
      'between the provided dates (inclusive). '.
      'Note that participants who do not have an email address will not be included in the '.
      'list provided.' );
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

    // create the necessary enum arrays
    $languages = array( 'any' );
    foreach( $participant_class_name::get_enum_values( 'language' ) as $language )
      $languages[] = $language;
    $languages = array_combine( $languages, $languages );

    $types = array( 'added or changed', 'removed' );
    $types = array_combine( $types, $types );

    $this->set_parameter( 'language', 'any', true, $languages );
    $this->set_parameter( 'type', 'added or changed', true, $types );
  }
}

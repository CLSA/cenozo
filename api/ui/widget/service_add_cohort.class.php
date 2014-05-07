<?php
/**
 * service_add_cohort.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget service add_cohort
 */
class service_add_cohort extends base_add_list
{
  /**
   * Constructor
   * 
   * Defines all variables which need to be set for the associated template.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $name The name of the cohort.
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'service', 'cohort', $args );
    $this->set_heading( '' );
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

    $service_class_name = lib::get_class_name( 'database\service' );

    $grouping_list = array();
    foreach( $service_class_name::get_grouping_types() as $grouping )
      $grouping_list[] = $grouping;
    $this->set_variable( 'grouping_list', $grouping_list );
  }

  /**
   * Overrides the cohort list widget's method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return int
   * @access protected
   */
  public function determine_cohort_count( $modifier = NULL )
  {
    $cohort_class_name = lib::get_class_name( 'database\cohort' );

    $existing_cohort_ids = array();
    foreach( $this->get_record()->get_cohort_list() as $db_cohort )
      $existing_cohort_ids[] = $db_cohort->id;

    if( 0 < count( $existing_cohort_ids ) )
    {
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'id', 'NOT IN', $existing_cohort_ids );
    }

    return $cohort_class_name::count( $modifier );
  }

  /**
   * Overrides the cohort list widget's method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return array( record )
   * @access protected
   */
  public function determine_cohort_list( $modifier = NULL )
  {
    $cohort_class_name = lib::get_class_name( 'database\cohort' );

    $existing_cohort_ids = array();
    foreach( $this->get_record()->get_cohort_list() as $db_cohort )
      $existing_cohort_ids[] = $db_cohort->id;

    if( 0 < count( $existing_cohort_ids ) )
    {
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'id', 'NOT IN', $existing_cohort_ids );
    }

    return $cohort_class_name::select( $modifier );
  }
}

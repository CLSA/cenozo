<?php
/**
 * activity_chart.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget activity chart
 */
class activity_chart extends \cenozo\ui\widget
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
    parent::__construct( 'activity', 'chart', $args );
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

    $site_class_name = lib::get_class_name( 'database\site' );
    $activity_class_name = lib::get_class_name( 'database\activity' );
    $user_class_name = lib::get_class_name( 'database\user' );
    $setting_manager = lib::create( 'business\setting_manager' );

    $month_data = array();
    $month_columns = array(
      array( 'type' => 'date', 'name' => 'Date' ),
      array( 'type' => 'number', 'name' => 'Overall' )
    );

    // don't include activity performed by the machine user
    $db_user = $user_class_name::get_unique_record(
      'name', $setting_manager->get_setting( 'general', 'machine_user' ) );
    $site_mod = lib::create( 'database\modifier' );
    $site_mod->order( 'name' );

    // start by building the array from the overall usage
    // this will include all weeks which had any activity
    $activity_mod = lib::create( 'database\modifier' );
    $activity_mod->where( 'DATEDIFF( UTC_TIMESTAMP(), datetime )', '<=', 31 );
    if( $db_user ) $activity_mod->where( 'user_id', '!=', $db_user->id );
    $overall_usage = $activity_class_name::get_usage( $activity_mod );
    foreach( $overall_usage as $date => $time ) $month_data[$date] = array( $time/60 );

    foreach( $site_class_name::select( $site_mod ) as $db_site )
    {
      // get the usage for this site only
      $activity_mod = lib::create( 'database\modifier' );
      if( $db_user ) $activity_mod->where( 'user_id', '!=', $db_user->id );
      $activity_mod->where( 'site_id', '=', $db_site->id );
      $activity_mod->where( 'DATEDIFF( UTC_TIMESTAMP(), datetime )', '<=', 31 );

      $month_columns[] = array(
        'type' => 'number',
        'site_id' => $db_site->id,
        'name' => $db_site->name );
      $site_usage = $activity_class_name::get_usage( $activity_mod );

      // make sure to set the value to 0 if no value is returned
      foreach( $month_data as $date => $usage )
        $month_data[$date][] = array_key_exists( $date, $site_usage ) ? $site_usage[$date]/60 : 0;
    }

    $year_data = array();
    $year_columns = array(
      array( 'type' => 'date', 'name' => 'Date' ),
      array( 'type' => 'number', 'name' => 'Overall' )
    );

    // start by building the array from the overall usage
    // this will include all weeks which had any activity
    $activity_mod = lib::create( 'database\modifier' );
    $activity_mod->where( 'DATEDIFF( UTC_TIMESTAMP(), datetime )', '<=', 365 );
    if( $db_user ) $activity_mod->where( 'user_id', '!=', $db_user->id );
    $overall_usage = $activity_class_name::get_usage( $activity_mod, true );
    foreach( $overall_usage as $date => $time ) $year_data[$date] = array( $time/60/60 );

    foreach( $site_class_name::select( $site_mod ) as $db_site )
    {
      // get the usage for this site only
      $activity_mod = lib::create( 'database\modifier' );
      if( $db_user ) $activity_mod->where( 'user_id', '!=', $db_user->id );
      $activity_mod->where( 'site_id', '=', $db_site->id );
      $activity_mod->where( 'DATEDIFF( UTC_TIMESTAMP(), datetime )', '<=', 365 );

      $year_columns[] = array(
        'type' => 'number',
        'site_id' => $db_site->id,
        'name' => $db_site->name );
      $site_usage = $activity_class_name::get_usage( $activity_mod, true );

      // make sure to set the value to 0 if no value is returned
      foreach( $year_data as $date => $usage )
        $year_data[$date][] = array_key_exists( $date, $site_usage ) ? $site_usage[$date]/60/60 : 0;
    }

    $this->set_variable( 'month_title', 'Server Activity Over the Last Month (in minutes/day)' );
    $this->set_variable( 'month_columns', $month_columns );
    $this->set_variable( 'month_data', $month_data );
    $this->set_variable( 'year_title', 'Server Activity Over the Last Year (in hours/week)' );
    $this->set_variable( 'year_columns', $year_columns );
    $this->set_variable( 'year_data', $year_data );
  }
}
?>

<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\script;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    // join to limesurvey tables to get the survey name
    if( $select->has_column( 'survey_title' ) )
    {
      $surveys_class_name = lib::get_class_name( 'database\limesurvey\surveys' );
      
      $survey_table_array = array();
      foreach( $surveys_class_name::get_titles() as $sid => $title )
        $survey_table_array[] = sprintf( 'SELECT %s sid, "%s" title', $sid, $title );
      $survey_table = sprintf( '( %s ) AS survey', implode( $survey_table_array, ' UNION ' ) );
      $modifier->left_join( $survey_table, 'script.sid', 'survey.sid' );
      $select->add_table_column( 'survey', 'title', 'survey_title' );
    }

    if( $select->has_column( 'url' ) )
      $select->add_column( sprintf( 'CONCAT( "%s/index.php?sid=", script.sid )', LIMESURVEY_URL ), 'url', false );
  }
}

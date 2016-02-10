<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\survey;
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

    if( $select->has_column( 'title' ) )
    {
      // link to the surveys_languagesettings table
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'surveys.sid', '=', 'surveyls_survey_id', false );
      $join_mod->where( 'surveys.language', '=', 'surveyls_language', false );
      $modifier->join_modifier( 'surveys_languagesettings', $join_mod );

      $select->add_table_column( 'surveys_languagesettings', 'surveyls_title', 'title' );
    }
  }
}

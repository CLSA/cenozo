<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\study_phase;
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

    $session = lib::create( 'business\session' );
    $db_application = lib::create( 'business\session' )->get_application();

    $modifier->join( 'study', 'study_phase.study_id', 'study.id' );
    $modifier->left_join( 'identifier', 'study_phase.identifier_id', 'identifier.id' );

    // Note: not sure why we restrict study-phase by application study, so disabling for v3 so we don't break v2
    if( !$session->version3 )
    {
      // if the application has a study-phase then only show the parent study's phases
      $db_study_phase = $db_application->get_study_phase();
      if( !is_null( $db_study_phase ) ) $modifier->where( 'study_phase.study_id', '=', $db_study_phase->study_id );
    }
  }
}

<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\study;
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

    $db_application = lib::create( 'business\session' )->get_application();

    $modifier->left_join( 'identifier', 'study.identifier_id', 'identifier.id' );
    $modifier->left_join( 'consent_type', 'study.consent_type_id', 'consent_type.id' );
    $modifier->left_join( 'event_type', 'study.completed_event_type_id', 'event_type.id' );

    // if the application has a study-phase then only show the parent study
    $db_study_phase = $db_application->get_study_phase();
    if( !is_null( $db_study_phase ) ) $modifier->where( 'study.id', '=', $db_study_phase->study_id );
  }
}

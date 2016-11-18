<?php
/**
 * overview.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\business\overview;
use cenozo\lib, cenozo\log;

/**
 * overview: withdraw
 */
class withdraw extends \cenozo\business\overview\base_overview
{
  /**
   * Implements abstract method
   */
  protected function build()
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );

    $survey_manager = lib::create( 'business\survey_manager' );
    $session = lib::create( 'business\session' );
    $db = $session->get_database();
    $db_application = $session->get_application();
    $db_site = $session->get_site();
    $db_role = $session->get_role();
    $db_user = $session->get_user();

    $data = array();


    // create generic select and modifier objects which can be re-used
    $select = lib::create( 'database\select' );
    $select->add_column( 'COUNT(*)', 'total', false );
    $select->add_column(
      'CONCAT( MONTHNAME( survey.submitdate ), ", ", YEAR( survey.submitdate ) )', 'month', false );

    $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'participant_last_consent', 'participant.id', 'participant_last_consent.participant_id' );
    $modifier->join( 'consent_type', 'participant_last_consent.consent_type_id', 'consent_type.id' );
    $modifier->join( 'consent', 'participant_last_consent.consent_id', 'consent.id' );
    $modifier->where( 'consent_type.name', '=', 'participation' );
    $modifier->where( 'consent.accept', '=', false );
    $modifier->group( 'DATE_FORMAT( survey.submitdate, "%Y%m" )' );

    $survey_manager->add_withdraw_option_column( $select, $modifier, 'option', true );

    $node = NULL;
    foreach( $participant_class_name::select( $select, $modifier ) as $row )
    {
      log::debug( $row );
      if( is_null( $node ) || $node->get_label() != $row['month'] )
      {
        if( !is_null( $node ) ) $node->find_node( 'Total' )->set_value( $total );
        $node = $this->add_root_item( $row['month'] );
        $this->add_item( $node, 'Total', 0 );
        $this->add_item( $node, 'Option #1', 0 );
        $this->add_item( $node, 'Option #2', 0 );
        $this->add_item( $node, 'Option #3', 0 );
        $total = 0;
      }

      $node->find_node( 'Option #'.$row['option'] )->set_value( $row['total'] );
      $total += $row['total'];
    }

    $this->root_node->reverse_child_order();
    $this->root_node->add_child( $this->root_node->get_summary_node(), true );
  }
}

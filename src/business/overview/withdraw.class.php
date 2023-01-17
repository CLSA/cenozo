<?php
/**
 * overview.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
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
  protected function build( $modifier = NULL )
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $survey_manager_class_name = lib::get_class_name( 'business\survey_manager' );

    $setting_manager = lib::create( 'business\setting_manager' );
    $withdraw_option_and_delink = $setting_manager->get_setting( 'general', 'withdraw_option_and_delink' );
    $survey_manager = lib::create( 'business\survey_manager' );
    $session = lib::create( 'business\session' );
    $db = $session->get_database();
    $db_application = $session->get_application();
    $db_site = $session->get_site();
    $db_role = $session->get_role();
    $db_user = $session->get_user();

    // create generic select and modifier objects which can be re-used
    $select = lib::create( 'database\select' );
    $select->add_column( 'COUNT(*)', 'total', false );
    $select->add_column(
      'CONCAT( MONTHNAME( consent.datetime ), ", ", YEAR( consent.datetime ) )', 'month', false );
    $select->add_column( 'participant.first_name = "(censored)"', 'delinked', false );

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'participant.exclusion_id', '=', NULL );
    $modifier->join( 'participant_last_consent', 'participant.id', 'participant_last_consent.participant_id' );
    $modifier->join( 'consent_type', 'participant_last_consent.consent_type_id', 'consent_type.id' );
    $modifier->join( 'consent', 'participant_last_consent.consent_id', 'consent.id' );
    $modifier->where( 'consent_type.name', '=', 'participation' );
    $modifier->where( 'consent.accept', '=', false );
    $modifier->group( 'DATE_FORMAT( consent.datetime, "%Y%m" )' );
    if( $withdraw_option_and_delink ) $modifier->group( 'option_and_delink.option' );
    $modifier->group( 'participant.first_name = "(censored)"' );

    if( 'mastodon' != $db_application->get_application_type()->name )
    { // special consideration for non-mastodon applications
      if( $db_application->release_based )
      {
        $join_mod = lib::create( 'database\modifier' );
        $join_mod->where( 'participant.id', '=', 'application_has_participant.participant_id', false );
        $join_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
        $modifier->join_modifier( 'application_has_participant', $join_mod );
        $modifier->where( 'application_has_participant.datetime', '!=', NULL );
      }

      // restrict by site
      if( !$db_role->all_sites && 'mastodon' != $db_application->get_application_type()->name )
      {
        $join_mod = lib::create( 'database\modifier' );
        $join_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
        $join_mod->where( 'participant_site.application_id', '=', $db_application->id );
        $modifier->join_modifier( 'participant_site', $join_mod );
        $modifier->where( 'participant_site.site_id', '=', $db_site->id );
      }
    }

    if( $withdraw_option_and_delink )
    {
      $survey_manager->create_option_and_delink_table();
      $modifier->left_join( 'option_and_delink', 'participant.uid', 'option_and_delink.uid' );
      $select->add_column( 'IFNULL( option_and_delink.option, "no data" )', 'option', false );
      $select->add_column( 'option_and_delink.delink', 'delink', false );
    }

    $node = NULL;
    foreach( $participant_class_name::select( $select, $modifier ) as $row )
    {
      if( is_null( $node ) || $node->get_label() != $row['month'] )
      {
        if( !is_null( $node ) ) $node->find_node( 'Total' )->set_value( $total );
        $node = $this->add_root_item( $row['month'] );
        $this->add_item( $node, 'Total', 0 );
        $this->add_item( $node, 'Delink', 0 );
        $this->add_item( $node, 'Have been delinked', 0 );
        if( $withdraw_option_and_delink )
        {
          $option_node = $this->add_item( $node, 'Withdraw Option' );
          $this->add_item( $option_node, 'Option #1', 0 );
          $this->add_item( $option_node, 'Option #2', 0 );
          $this->add_item( $option_node, 'Option #3', 0 );
          $this->add_item( $option_node, 'Default (no option selected)', 0 );
          $this->add_item( $option_node, 'No Data', 0 );
        }
        $total = 0;
      }

      if( $withdraw_option_and_delink )
      {
        if( $row['delink'] )
        {
          $child_node = $node->find_node( 'Delink' );
          $child_node->set_value( $child_node->get_value() + $row['total'] );
          if( $row['delinked'] )
          {
            $child_node = $node->find_node( 'Have been delinked' );
            $child_node->set_value( $child_node->get_value() + $row['total'] );
          }
        }

        $name = '';
        if( 'default' == $row['option'] ) $name = 'Default (no option selected)';
        else if( 'no data' == $row['option'] ) $name = 'No Data';
        else $name = 'Option #'.$row['option'];

        $child_node = $node->find_node( 'Withdraw Option' )->find_node( $name );
        $child_node->set_value( $child_node->get_value() + $row['total'] );
      }
      $total += $row['total'];
    }
    if( !is_null( $node ) ) $node->find_node( 'Total' )->set_value( $total );

    $this->root_node->reverse_child_order();
    $this->root_node->add_child( $this->root_node->get_summary_node(), true );
  }
}

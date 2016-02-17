<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\search_result;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\site_restricted_module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();

    // always join to the search table
    $modifier->join( 'search', 'search_result.search_id', 'search.id' );

    // get the search words from the query
    $search_manager = lib::create( 'business\search_manager' );
    $query = $this->get_argument( 'q', '' );
    $word_list = $search_manager->get_keywords( $query );

    if( 0 < count( $word_list ) )
    {
      $search_manager->search( $query );
      $modifier->where( 'search.word', 'IN', $word_list );
    }
    else
    {
      // purposefully return nothing
      $modifier->where( 'search.word', '=', NULL );
    }

    // add a little search_result ranking magic
    $modifier->group( 'search_result.participant_id' );
    $select->add_column( 'COUNT( DISTINCT CONCAT( search_result.subject, ".", column_name ) )', 'hits', false );
    $select->add_column(
      'GROUP_CONCAT( CONCAT( search_result.subject, ".", column_name, ": \"", value, "\"" ) SEPARATOR "\n" )',
      'value', false );

    // make sure the user has access to the participant related to the search_result result
    if( $db_application->release_based )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'search_result.participant_id', '=', 'application_has_participant.participant_id', false );
      $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
      $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
      $modifier->join_modifier(
        'application_has_participant', $sub_mod, $db_application->release_based ? '' : 'left' );

      if( $select->has_table_columns( 'preferred_site' ) )
        $modifier->join( 'site', 'application_has_participant.preferred_site_id', 'preferred_site.id',
                         'left', 'preferred_site' );
    }

    // restrict by site
    $db_restrict_site = $this->get_restricted_site();
    if( !is_null( $db_restrict_site ) )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'search_result.participant_id', '=', 'participant_site.participant_id', false );
      $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
      $sub_mod->where( 'participant_site.site_id', '=', $db_restrict_site->id );
      $modifier->join_modifier( 'participant_site', $sub_mod );
    }
  }
}

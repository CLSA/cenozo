<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class base_export_part_module extends \cenozo\service\module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    $db_application = lib::create( 'business\session' )->get_application();

    parent::prepare_read( $select, $modifier );

    if( $select->has_table_columns( 'export' ) )
      $modifier->join( 'export', 'export_id', 'export.id' );

    if( $select->has_column( 'formatted_subtype' ) )
    {
      // site: default_#, effective_#, preferred_# (for mastodon, otherwise there are no #s)
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'table_name', '=', 'site' );
      $join_mod->where( 'subtype', 'RLIKE', '_[0-9]+$' );
      $join_mod->where(
        'SUBSTR(subtype, LOCATE("_", subtype)+1)',
        '=',
        'site_application.name',
        false
      );
      $modifier->join_modifier( 'application', $join_mod, 'left', 'site_application' );

      // address: first, primary (leave as-is)

      // application, auxiliary, consent, event, interview, participant_identifier, stratum, study: #
      $table_list = [
        ['name' => 'application', 'table' => 'application'],
        ['name' => 'auxiliary', 'table' => 'collection'],
        ['name' => 'consent', 'table' => 'consent_type'],
        ['name' => 'event', 'table' => 'event_type'],
        ['name' => 'participant_identifier', 'table' => 'identifier'],
        ['name' => 'stratum', 'table' => 'stratum'],
        ['name' => 'study', 'table' => 'study']
      ];
      if( 'mastodon' != $db_application->name ) $table_list[] = ['name' => 'interview', 'table' => 'qnaire'];

      $case = <<<SQL
        CASE table_name
          WHEN "site" THEN IF(
            subtype IN ("default", "effective", "preferred"),
            subtype,
            site_application.name
          )
          WHEN "auxiliary" THEN IF(
            column_name = "is_in_collection",
            collection.name,
            column_name
          )
      SQL;

      foreach( $table_list as $table )
      {
        if( 'auxiliary' != $table['name'] )
          $case .= sprintf( ' WHEN "%s" THEN %s.name', $table['name'], $table['table'] );
        $join_mod = lib::create( 'database\modifier' );
        $join_mod->where( 'table_name', '=', $table['name'] );
        $join_mod->where( 'subtype', '=', sprintf( '%s.id', $table['table'] ), false );
        $modifier->join_modifier( $table['table'], $join_mod, 'left' );
      }
      $case .= ' ELSE subtype END';

      $select->add_column( $case, 'formatted_subtype', false );
    }
  }
}

<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\export\participant;
use cenozo\lib, cenozo\log;

/**
 * The base class of all query (collection-based get) services
 */
class query extends \cenozo\service\query
{
  /**
   * Extends parent method
   */
  protected function prepare()
  {
    parent::prepare();
    
    // ignore 404 errors (this is a special service)
    if( 404 == $this->status->get_code() ) $this->status->set_code( 200 );
  }

  /**
   * Extends parent method
   */
  protected function setup()
  {
    parent::setup();

    // ignore the regular modifier and start fresh
    $this->modifier = lib::create( 'database\modifier' );

    // apply the export columns to the modifier
    $db_export = $this->get_parent_record();
    $export_column_mod = lib::create( 'database\modifier' );
    $export_column_mod->order( 'rank' );
    foreach( $db_export->get_export_column_object_list( $export_column_mod ) as $db_export_column )
      $db_export_column->apply_modifier( $this->modifier );

    // apply the export restrictions to the modifier
    $export_restriction_mod = lib::create( 'database\modifier' );
    $export_restriction_mod->order( 'rank' );
    foreach( $db_export->get_export_restriction_object_list( $export_restriction_mod ) as $db_export_restriction )
      $db_export_restriction->apply_modifier( $this->modifier );
  }

  /**
   * Extends parent method
   */
  protected function get_record_count()
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $modifier = clone $this->modifier;
    return $participant_class_name::count( $modifier );
  }

  /**
   * Extends parent method
   */
  protected function get_record_list()
  {
    return array();
  }
}

<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\participant\relation;
use cenozo\lib, cenozo\log;

class query extends \cenozo\service\query
{
  /**
   * Extends parent method
   */
  protected function get_record_count()
  {
    $relation_class_name = lib::create( 'database\relation' );

    $db_participant = $this->get_parent_record();
    $db_relation = $relation_class_name::get_unique_record( 'participant_id', $db_participant->id );
    if( is_null( $db_relation ) ) return 0;

    $modifier = clone $this->modifier;
    $modifier->where( 'primary_participant_id', '=', $db_relation->primary_participant_id );
    return $relation_class_name::count( $modifier );
  }

  /**
   * Extends parent method
   */
  protected function get_record_list()
  {
    $relation_class_name = lib::create( 'database\relation' );

    $db_participant = $this->get_parent_record();
    $db_relation = $relation_class_name::get_unique_record( 'participant_id', $db_participant->id );
    if( is_null( $db_relation ) ) return [];

    $select = clone $this->select;
    $modifier = clone $this->modifier;
    $modifier->where( 'primary_participant_id', '=', $db_relation->primary_participant_id );
    $this->select->apply_aliases_to_modifier( $modifier );

    return $relation_class_name::select( $select, $modifier );
  }
}

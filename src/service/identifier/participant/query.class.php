<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\identifier\participant;
use cenozo\lib, cenozo\log;

/**
 * Extends parent class
 */
class query extends \cenozo\service\query
{
  /**
   * Extends parent method
   */
  protected function prepare()
  {
    parent::prepare();

    // the status will be 404, reset it to 200
    $this->status->set_code( 200 );
  }

  /**
   * Extends parent method
   */
  protected function get_record_count()
  {
    $participant_class_name = lib::create( 'database\participant' );

    $db_identifier = $this->get_parent_record();
    $modifier = clone $this->modifier;
    $modifier->join( 'participant_identifier', 'participant.id', 'participant_identifier.participant_id' );
    $modifier->where( 'participant_identifier.identifier_id', '=', $db_identifier->id );
    $this->select->apply_aliases_to_modifier( $modifier );

    return $participant_class_name::count( $modifier, true ); // distinct
  }

  /**
   * Extends parent method
   */
  protected function get_record_list()
  {
    $participant_class_name = lib::create( 'database\participant' );

    $db_identifier = $this->get_parent_record();
    $select = clone $this->select;
    $select->set_distinct( true );
    $modifier = clone $this->modifier;
    $modifier->join( 'participant_identifier', 'participant.id', 'participant_identifier.participant_id' );
    $modifier->where( 'participant_identifier.identifier_id', '=', $db_identifier->id );
    $this->select->apply_aliases_to_modifier( $modifier );

    return $participant_class_name::select( $select, $modifier );
  }
}

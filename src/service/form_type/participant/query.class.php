<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\form_type\participant;
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

    $db_form_type = $this->get_parent_record();
    $modifier = clone $this->modifier;
    $modifier->join( 'form', 'participant.id', 'form.participant_id' );
    $modifier->where( 'form.form_type_id', '=', $db_form_type->id );
    $this->select->apply_aliases_to_modifier( $modifier );

    return $participant_class_name::count( $modifier, true ); // distinct
  }

  /**
   * Extends parent method
   */
  protected function get_record_list()
  {
    $participant_class_name = lib::create( 'database\participant' );

    $db_form_type = $this->get_parent_record();
    $select = clone $this->select;
    $select->set_distinct( true );
    $modifier = clone $this->modifier;
    $modifier->join( 'form', 'participant.id', 'form.participant_id' );
    $modifier->where( 'form.form_type_id', '=', $db_form_type->id );
    $this->select->apply_aliases_to_modifier( $modifier );

    return $participant_class_name::select( $select, $modifier );
  }
}

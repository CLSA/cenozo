<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\consent_type\participant;
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

    $db_consent_type = $this->get_parent_record();
    $modifier = clone $this->modifier;
    $modifier->join( 'consent', 'participant.id', 'consent.participant_id' );
    $modifier->where( 'consent.consent_type_id', '=', $db_consent_type->id );
    $modifier->group( 'participant.id' );

    return $participant_class_name::count( $modifier );
  }

  /**
   * Extends parent method
   */
  protected function get_record_list()
  {
    $participant_class_name = lib::create( 'database\participant' );

    $db_consent_type = $this->get_parent_record();
    $modifier = clone $this->modifier;
    $modifier->join( 'consent', 'participant.id', 'consent.participant_id' );
    $modifier->where( 'consent.consent_type_id', '=', $db_consent_type->id );
    $modifier->group( 'participant.id' );

    return $participant_class_name::select( $this->select, $modifier );
  }
}
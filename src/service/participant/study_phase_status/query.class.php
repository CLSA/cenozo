<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\participant\study_phase_status;
use cenozo\lib, cenozo\log;

class query extends \cenozo\service\query
{
  /**
   * Extends parent method
   */
  protected function get_record_count()
  {
    $db_participant = $this->get_parent_record();
    $modifier = clone $this->modifier;
    $modifier->where( 'study.enable_status', '=', true );
    $this->select->apply_aliases_to_modifier( $modifier );
    return $db_participant->get_study_phase_status_count( $modifier );
  }

  /**
   * Extends parent method
   */
  protected function get_record_list()
  {
    $db_participant = $this->get_parent_record();
    $modifier = clone $this->modifier;
    $modifier->where( 'study.enable_status', '=', true );
    $this->select->apply_aliases_to_modifier( $modifier );
    return $db_participant->get_study_phase_status_list( $this->select, $modifier );
  }
}

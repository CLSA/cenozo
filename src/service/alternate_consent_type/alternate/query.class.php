<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\alternate_consent_type\alternate;
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
    $alternate_class_name = lib::create( 'database\alternate' );

    $db_alternate_consent_type = $this->get_parent_record();
    $modifier = clone $this->modifier;
    $modifier->join( 'alternate_consent', 'alternate.id', 'alternate_consent.alternate_id' );
    $modifier->where( 'alternate_consent.alternate_consent_type_id', '=', $db_alternate_consent_type->id );
    $this->select->apply_aliases_to_modifier( $modifier );

    return $alternate_class_name::count( $modifier, true ); // distinct
  }

  /**
   * Extends parent method
   */
  protected function get_record_list()
  {
    $alternate_class_name = lib::create( 'database\alternate' );

    $db_alternate_consent_type = $this->get_parent_record();
    $select = clone $this->select;
    $select->set_distinct( true );
    $modifier = clone $this->modifier;
    $modifier->join( 'alternate_consent', 'alternate.id', 'alternate_consent.alternate_id' );
    $modifier->where( 'alternate_consent.alternate_consent_type_id', '=', $db_alternate_consent_type->id );
    $this->select->apply_aliases_to_modifier( $modifier );

    return $alternate_class_name::select( $select, $modifier );
  }
}

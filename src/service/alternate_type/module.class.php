<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\alternate_type;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $this->add_count_column( 'alternate_count', 'alternate', $select, $modifier);
    $this->add_count_column( 'role_count', 'role', $select, $modifier );
    $select->add_column( 'alternate_consent_type_id IS NOT NULL', 'has_alternate_consent_type', false, 'boolean' );
    $modifier->left_join( 'alternate_consent_type', 'alternate_type.alternate_consent_type_id', 'alternate_consent_type.id' );

    if( $select->has_column( 'has_role' ) )
    {
      $db_role = lib::create( 'business\session' )->get_role();
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'alternate_type.id', '=', 'current_role_has_alternate_type.alternate_type_id', false );
      $join_mod->where( 'current_role_has_alternate_type.role_id', '=', $db_role->id );
      $modifier->join_modifier( 'role_has_alternate_type', $join_mod, 'left', 'current_role_has_alternate_type' );
      $select->add_column( 'current_role_has_alternate_type.role_id IS NOT NULL', 'has_role', false, 'boolean' );
    }
  }
}

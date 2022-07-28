<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\equipment;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\site_restricted_module
{
  /**
   * Extend parent method
   */
  public function validate()
  {
    parent::validate();

    if( 300 > $this->get_status()->get_code() )
    {
      if( 'POST' != $this->get_method() )
      {
        $db_equipment = $this->get_resource();

        if( !is_null( $db_equipment ) )
        {
          // restrict by site
          $db_restrict_site = $this->get_restricted_site();
          if( !is_null( $db_restrict_site ) )
          {
            if( $db_equipment->site_id != $db_restrict_site->id ) $this->get_status()->set_code( 403 );
          }
        }
      }
    }
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $modifier->join( 'equipment_type', 'equipment.equipment_type_id', 'equipment_type.id' );
    $modifier->left_join( 'site', 'equipment.site_id', 'site.id' );
    $equipment_loan_mod = lib::create( 'database\modifier' );
    $equipment_loan_mod->where( 'equipment.id', '=', 'equipment_loan.equipment_id', false );
    $equipment_loan_mod->where( 'equipment_loan.end_datetime', '=', NULL );
    $modifier->join_modifier( 'equipment_loan', $equipment_loan_mod, 'left' );
    $modifier->left_join( 'participant', 'equipment_loan.participant_id', 'participant.id' );

    // restrict by site
    $db_restrict_site = $this->get_restricted_site();
    if( !is_null( $db_restrict_site ) )
      $modifier->where( 'equipment.site_id', '=', $db_restrict_site->id );
  }
}

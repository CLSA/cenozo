<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\report_restriction;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\module
{
  /**
   * Extends parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    // don't show site selection restriction for roles that do not have all-site access
    if( !lib::create( 'business\session' )->get_role()->all_sites )
    {
      $modifier->where_bracket( true );
      $modifier->where( 'report_restriction.subject', '!=', 'site' );
      $modifier->or_where( 'report_restriction.restriction_type', '!=', 'table' );
      $modifier->where_bracket( false );
    }

    // if the parent is a report then add the value
    if( 'report' == $this->get_parent_subject() )
      $select->add_table_column( 'report_has_report_restriction', 'value' );
    // if the parent is a report_schedule then add the value
    else if( 'report_schedule' == $this->get_parent_subject() )
      $select->add_table_column( 'report_schedule_has_report_restriction', 'value' );
  }
}

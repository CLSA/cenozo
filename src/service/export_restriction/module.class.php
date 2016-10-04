<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\export_restriction;
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

    if( $select->has_table_columns( 'export' ) )
      $modifier->join( 'export', 'export_column.export_id', 'export.id' );
    if( $select->has_table_columns( 'export_column' ) )
      $modifier->join( 'export_column', 'export_restriction.export_column_id', 'export_column.id' );
  }
}

<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\trace_type_mail;
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

    $modifier->join( 'trace_type', 'trace_type_mail.trace_type_id', 'trace_type.id' );
    $modifier->join( 'language', 'trace_type_mail.language_id', 'language.id' );

    if( $select->has_column( 'delay' ) )
    {
      $select->add_column(
        'IF( '.
          '1 = trace_type_mail.delay_offset, '.
          'CONCAT( "1 ", TRIM("s" FROM trace_type_mail.delay_unit) ), '.
          'CONCAT( trace_type_mail.delay_offset, " ", trace_type_mail.delay_unit ) '.
        ')',
        'delay',
        false
      );
    }

    $db_mail_template = $this->get_resource();
    if( !is_null( $db_mail_template ) )
    {
      if( $select->has_column( 'validate' ) ) $select->add_constant( $db_mail_template->validate(), 'validate' );
    }
  }
}

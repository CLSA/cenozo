<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\recording_file;
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

    if( $select->has_table_columns( 'recording' ) )
      $modifier->join( 'recording', 'recording_file.recording_id', 'recording.id' );
    if( $select->has_table_columns( 'language' ) )
      $modifier->join( 'language', 'recording_file.language_id', 'language.id' );
  }
}

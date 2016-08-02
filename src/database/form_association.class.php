<?php
/**
 * form_association.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * form_association: record
 */
class form_association extends record
{
  /**
   * TODO: document
   */
  public function get_associated_record()
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to query participant with no primary key.' );
      return NULL;
    }

    $subject_class_name = lib::get_class_name( sprintf( 'database\%s', $subject ) );
    return new $subject_class_name( $this->record_id );
  }
}

<?php
/**
 * form.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * form: record
 */
class form extends record
{
  public function get_filename()
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to query participant with no primary key.' );
      return NULL;
    }

    $padded_id = str_pad( $this->id, 7, '0', STR_PAD_LEFT );
    $filename = sprintf( '%s/%s/%s/%s/%s.pdf',
                         FORM_PATH,
                         $this->get_form_type()->name,
                         substr( $padded_id, 0, 3 ),
                         substr( $padded_id, 3, 2 ),
                         substr( $padded_id, 5 ) );

    return $filename;
  }
}

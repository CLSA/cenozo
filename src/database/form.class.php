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
  /**
   * TODO: document
   */
  public function get_filename()
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to query form with no primary key.' );
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

  /**
   * TODO: document
   */
  public function add_association( $subject, $id )
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to query form with no primary key.' );
      return NULL;
    }

    static::db()->execute( sprintf(
      'INSERT IGNORE INTO form_association'."\n".
      'SET create_timestamp = NULL,'."\n".
      '    form_id = %s,'."\n".
      '    subject = %s,'."\n".
      '    record_id = %s',
      static::db()->format_string( $this->id ),
      static::db()->format_string( $subject ),
      static::db()->format_string( $id ) ) );
  }
}

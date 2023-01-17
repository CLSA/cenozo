<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\overview;
use cenozo\lib, cenozo\log;

/**
 * The base class of all get (single-resource) services
 */
class get extends \cenozo\service\get
{
  /**
   * Extends parent method
   */
  protected function execute()
  {
    $modifier_class_name = lib::get_class_name( 'database\modifier' );

    $data = NULL;

    // add the overview's data
    $db_overview = $this->get_leaf_record();
    if( !is_null( $db_overview ) )
    {
      // process the data modifier, if there is one
      $data_modifier_string = $this->get_argument( 'data_modifier', NULL );
      $data_mod = NULL;
      if( !is_null( $data_modifier_string ) )
      {
        try
        {
          $data_mod = $modifier_class_name::from_json( $data_modifier_string );
        }
        catch( \cenozo\exception\base_exeption $e )
        {
          $this->status->set_code( 400 );
          throw $e;
        }
      }

      if( 'application/json' == $this->get_mime_type() )
      {
        // add the overview data as an additional field to the existing data
        $data = $db_overview->get_column_values( $this->select, $this->modifier );
        $data['data'] = $db_overview->get_executer()->get_data( $data_mod );
      }
      else
      {
        // replace the existing data with a flat version of the overview data
        $data = $db_overview->get_executer()->get_data( $data_mod, true );
      }
    }

    $this->set_data( $data );
  }
}

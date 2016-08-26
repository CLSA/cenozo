<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\consent;
use cenozo\lib, cenozo\log;

/**
 * The base class of all post services.
 */
class post extends \cenozo\service\service
{
  /**
   * Extends parent constructor
   */
  public function __construct( $path, $args, $file )
  {
    parent::__construct( 'POST', $path, $args, $file );
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    $consent_class_name = lib::get_class_name( 'database\consent' );

    // This is a special service to allow consents to be added to multiple participants at once
    $file = $this->get_file_as_array();
    if( array_key_exists( 'uid_list', $file ) )
    {
      if( array_key_exists( 'input_list', $file ) )
      {
        // change each column/value pair in the uid-list
        $modifier = lib::create( 'database\modifier' );
        $modifier->where( 'uid', 'IN', $file['uid_list'] );
        $this->set_data( $consent_class_name::multiedit( $modifier, (array) $file['input_list'] ) );
      }
      else
      {
        // go through the list and remove an UIDs which don't exist
        $data = array();
        $select = lib::create( 'database\select' );
        $select->add_column( 'uid' );
        $select->from( 'consent' );
        $modifier = lib::create( 'database\modifier' );
        $modifier->where( 'uid', 'IN', $file['uid_list'] );
        $modifier->order( 'uid' );
        foreach( $consent_class_name::select( $select, $modifier ) as $row ) $data[] = $row['uid'];
        $this->set_data( $data );
      }
    }
    else $this->status->set_code( 400 ); // must provide a uid_list
  }

  /**
   * Extends parent method
   */
  protected function create_resource( $index )
  {
    return NULL;
  }
}

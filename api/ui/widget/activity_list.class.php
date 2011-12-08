<?php
/**
 * activity_list.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget activity list
 * 
 * @package cenozo\ui
 */
class activity_list extends site_restricted_list
{
  /**
   * Constructor
   * 
   * Defines all variables required by the activity list.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    // by default sort the datetime column descending
    $this->sort_column = 'activity.datetime';
    $this->sort_desc = true;

    parent::__construct( 'activity', $args );
    
    $this->add_column( 'user.name', 'string', 'User', true );
    $this->add_column( 'site.name', 'string', 'Site', true );
    $this->add_column( 'role.name', 'string', 'Role', true );
    $this->add_column( 'operation.type', 'string', 'Type', true );
    $this->add_column( 'operation.subject', 'string', 'Subject', true );
    $this->add_column( 'operation.name', 'string', 'Name', true );
    $this->add_column( 'elapsed', 'string', 'Time', true );
    $this->add_column( 'error_code', 'string', 'Error', true );
    $this->add_column( 'datetime', 'datetime', 'Date', true );
  }

  /**
   * Set the rows array needed by the template.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function finish()
  {
    parent::finish();
    
    foreach( $this->get_record_list() as $record )
    {
      $db_operation = $record->get_operation();
      $this->add_row( $record->id,
        array( 'user.name' => $record->get_user()->name,
               'site.name' => $record->get_site()->name,
               'role.name' => $record->get_role()->name,
               'operation.type' => is_null( $db_operation ) ? 'n/a' : $db_operation->type,
               'operation.subject' => is_null( $db_operation ) ? 'n/a' : $db_operation->subject,
               'operation.name' => is_null( $db_operation ) ? 'n/a' : $db_operation->name,
               'elapsed' => sprintf( '%0.2fs', $record->elapsed ),
               'error_code' => is_null( $record->error_code ) ? '' : $record->error_code,
               'datetime' => $record->datetime ) );
    }

    $this->finish_setting_rows();
  }
}
?>

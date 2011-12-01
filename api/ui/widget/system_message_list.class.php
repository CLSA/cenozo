<?php
/**
 * system_message_list.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\log, cenozo\util;
use cenozo\business as bus;
use cenozo\database as db;
use cenozo\exception as exc;

/**
 * widget system_message list
 * 
 * @package cenozo\ui
 */
class system_message_list extends site_restricted_list
{
  /**
   * Constructor
   * 
   * Defines all variables required by the system_message list.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'system_message', $args );
    
    $this->add_column( 'site.name', 'string', 'Site', true );
    $this->add_column( 'role.name', 'string', 'Role', true );
    $this->add_column( 'title', 'string', 'Title', true );
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
      $db_site = $record->get_site();
      $db_role = $record->get_role();

      // assemble the row for this record
      $this->add_row( $record->id,
        array( 'site.name' => $db_site ? $db_site->name : 'all',
               'role.name' => $db_role ? $db_role->name : 'all',
               'title' => $record->title ) );
    }

    $this->finish_setting_rows();
  }

  /**
   * Overrides the parent class method to also include system messages with no site
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return int
   * @access protected
   */
  protected function determine_record_count( $modifier = NULL )
  {
    if( !is_null( $this->db_restrict_site ) )
    {
      if( NULL == $modifier ) $modifier = util::create( 'database\modifier' );
      $modifier->where( 'site_id', '=', $this->db_restrict_site->id );
      $modifier->or_where( 'site_id', '=', NULL );
    }
    
    // skip the parent method
    // php doesn't allow parent::parent::method() so we have to do the less safe code below
    $base_list_class_name = util::get_class_name( 'ui\widget\base_list' );
    return $base_list_class_name::determine_record_count( $modifier );
  }

  /**
   * Overrides the parent class method based on the restrict site member.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return array( record )
   * @access protected
   */
  protected function determine_record_list( $modifier = NULL )
  {
    if( !is_null( $this->db_restrict_site ) )
    {
      if( NULL == $modifier ) $modifier = util::create( 'database\modifier' );
      $modifier->where( 'site_id', '=', $this->db_restrict_site->id );
      $modifier->or_where( 'site_id', '=', NULL );
    }
    
    // skip the parent method
    // php doesn't allow parent::parent::method() so we have to do the less safe code below
    $base_list_class_name = util::get_class_name( 'ui\widget\base_list' );
    return $base_list_class_name::determine_record_list( $modifier );
  }
}
?>

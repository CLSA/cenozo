<?php
/**
 * user_list.class.php
 * 
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\pull;
use cenozo\lib, cenozo\log;

/**
 * Class for user list pull operations.
 * 
 * @abstract
 * @package cenozo\ui
 */
class user_list extends base_list
{
  /**
   * Constructor
   * 
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'user', $args );
  }

  /**
   * Sets up the operation with any pre-execution instructions that may be necessary.
   * 
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $site_class_name = lib::get_class_name( 'database\site' );
    $role_class_name = lib::get_class_name( 'database\role' );
    $site_mod = NULL;
    $role_mod = NULL;
    $new_restrictions = array();

    // go through the restriction array and convert references to site and role tables
    foreach( $this->restrictions as $restriction )
    {
      $table = strstr( $restriction['column'], '.', true );
      $col_name = substr( strstr( $restriction['column'], '.' ), 1 );
      if( 'site' == $table )
      {
        if( is_null( $site_mod ) ) $site_mod = lib::create( 'database\modifier' );
        $site_mod->where( $col_name, $restriction['operator'], $restriction['value'] );
      }
      else if( 'role' == $table )
      {
        if( is_null( $role_mod ) ) $role_mod = lib::create( 'database\modifier' );
        $role_mod->where( $col_name, $restriction['operator'], $restriction['value'] );
      }
      else $new_restrictions[] = $restriction;
    }

    // add the site id to the new restrictions array (if needed)
    if( !is_null( $site_mod ) )
    {
      $site_ids = array();
      foreach( $site_class_name::select( $site_mod ) as $db_site ) $site_ids[] = $db_site->id;

      if( 1 == count( $site_ids ) )
        $new_restrictions[] = array(
          'column' => 'site_id',
          'operator' => '=',
          'value' => current( $site_ids ) );
      else if( 1 < count( $site_ids ) )
        $new_restrictions[] = array(
          'column' => 'site_id',
          'operator' => 'in',
          'value' => $site_ids );
    }

    // add the role id to the new restrictions array (if needed)
    if( !is_null( $role_mod ) )
    {
      $role_ids = array();
      foreach( $role_class_name::select( $role_mod ) as $db_role ) $role_ids[] = $db_role->id;

      if( 1 == count( $role_ids ) )
        $new_restrictions[] = array(
          'column' => 'role_id',
          'operator' => '=',
          'value' => current( $role_ids ) );
      else if( 1 < count( $role_ids ) )
        $new_restrictions[] = array(
          'column' => 'role_id',
          'operator' => 'in',
          'value' => $role_ids );
    }

    // only bother to update the restrictions if at least one of the mods has been created
    if( !is_null( $site_mod ) || !is_null( $role_mod ) )
      $this->restrictions = $new_restrictions;
  }
}
?>

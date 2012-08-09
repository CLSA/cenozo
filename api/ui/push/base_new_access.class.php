<?php
/**
 * base_new_access.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * Base class for all "new_access" push operations.
 */
abstract class base_new_access extends base_record
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The widget's subject.
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $subject, $args )
  {
    parent::__construct( $subject, 'new_access', $args );
  }
  
  /**
   * Validate the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    if( 'user' != $this->get_subject() && 'site' != $this->get_subject() )
      throw lib::create( 'exception\runtime',
        sprintf( 'Subject is "%s" but must be either site or user only.', $this->get_subject() ),
        __METHOD__ );
  }

  /**
   * This method executes the operation's purpose.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    $id_list = 'user' == $this->get_subject()
             ? $this->get_argument( 'site_id_list' )
             : $this->get_argument( 'user_id_list' );

    foreach( $this->get_argument( 'role_id_list' ) as $role_id )
      $this->get_record()->add_access( $id_list, $role_id );
  }

  /**
   * Override parent method to handle id lists
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An argument list, usually those passed to the push operation.
   * @return array
   * @access protected
   */
  protected function convert_to_noid( $args )
  {
    $args = parent::convert_to_noid( $args );

    $role_class_name = lib::get_class_name( 'database\role' );
    $user_class_name = lib::get_class_name( 'database\user' );
    $site_class_name = lib::get_class_name( 'database\site' );

    $role_list = array();
    foreach( $args['role_id_list'] as $role_id )
      $role_list[] = $role_class_name::get_unique_from_primary_key( $role_id );
    $args['noid']['role_list'] = $role_list;
    unset( $args['role_id_list'] );

    if( 'user' == $this->get_subject() )
    {
      $site_list = array();
      foreach( $args['site_id_list'] as $site_id )
        $site_list[] = $site_class_name::get_unique_from_primary_key( $site_id );
      $args['noid']['site_list'] = $site_list;
      unset( $args['site_id_list'] );
    }
    else if( 'site' == $this->get_subject() )
    {
      $user_list = array();
      foreach( $args['user_id_list'] as $user_id )
        $user_list[] = $user_class_name::get_unique_from_primary_key( $user_id );
      $args['noid']['user_list'] = $user_list;
      unset( $args['user_id_list'] );
    }

    return $args;
  }

  /**
   * Override parent method to handle id lists
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An argument list, usually those passed to the push operation.
   * @return array
   * @access protected
   */
  protected function convert_from_noid( $args )
  {
    if( array_key_exists( 'noid', $args ) )
    {
      $role_class_name = lib::get_class_name( 'database\role' );
      $user_class_name = lib::get_class_name( 'database\user' );
      $site_class_name = lib::get_class_name( 'database\site' );

      $role_id_list = array();
      foreach( $args['noid']['role_list'] as $key )
      {
        try { $role_id_list[] = $role_class_name::get_primary_from_unique_key( $key ); }
        catch( \cenozo\exception\runtime $e ) {} // ignore roles which don't exist
      }
      $args['role_id_list'] = $role_id_list;
      unset( $args['noid']['role_list'] );

      if( 'user' == $this->get_subject() )
      {
        $site_id_list = array();
        foreach( $args['noid']['site_list'] as $key )
          $site_id_list[] = $site_class_name::get_primary_from_unique_key( $key );
        $args['site_id_list'] = $site_id_list;
        unset( $args['noid']['site_list'] );
      }

      if( 'site' == $this->get_subject() )
      {
        $user_id_list = array();
        foreach( $args['noid']['user_list'] as $key )
          $user_id_list[] = $user_class_name::get_primary_from_unique_key( $key );
        $args['user_id_list'] = $user_id_list;
        unset( $args['noid']['user_list'] );
      }
    }

    return parent::convert_from_noid( $args );
  }
}
?>

<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\user;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\site_restricted_module
{
  /**
   * Extend parent method
   */
  public function validate()
  {
    parent::validate();

    if( 300 > $this->get_status()->get_code() )
    {
      $record = $this->get_resource();

      if( $record && $record->id )
      {
        // don't include special users
        $access_mod = lib::create( 'database\modifier' );
        $access_mod->join( 'role', 'access.role_id', 'role.id' );
        $access_mod->where( 'role.special', '=', true );
        if( $record->get_access_count( $access_mod ) ) $this->get_status()->set_code( 403 );
      }
    }
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $setting_manager = lib::create( 'business\setting_manager' );
    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();
    $db_site = $session->get_site();
    $db_role = $session->get_role();

    // don't include special users
    $join_sel = lib::create( 'database\select' );
    $join_sel->from( 'access' );
    $join_sel->add_column( 'user_id' );

    $join_mod = lib::create( 'database\modifier' );
    $join_mod->join( 'role', 'access.role_id', 'role.id' );
    $join_mod->where( 'role.special', '=', true );
    $join_mod->group( 'user_id' );

    $modifier->left_join(
      sprintf( '( %s %s ) AS user_join_special_access', $join_sel->get_sql(), $join_mod->get_sql() ),
      'user.id',
      'user_join_special_access.user_id' );
    $modifier->where( 'user_join_special_access.user_id', '=', NULL );

    // we want to allow direct access to users even if they don't have access to this application/site,
    // so only restrict by application and site if we're getting a list of users, otherwise allow access
    // exception: collection user lists should never be restricted
    if( is_null( $this->get_resource() ) && 'collection' != $this->get_parent_subject() )
    {
      // only include users with access to this application
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'access' );
      $join_sel->add_column( 'user_id' );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->group( 'user_id' );

      $modifier->join(
        sprintf( '( %s %s ) AS user_join_site_access', $join_sel->get_sql(), $join_mod->get_sql() ),
        'user.id',
        'user_join_site_access.user_id' );

      // restrict by site
      $db_restrict_site = $this->get_restricted_site();
      if( !is_null( $db_restrict_site ) )
      {
        $join_sel = lib::create( 'database\select' );
        $join_sel->from( 'access' );
        $join_sel->set_distinct( true );
        $join_sel->add_column( 'user_id' );

        $join_mod = lib::create( 'database\modifier' );
        $join_mod->where( 'access.site_id', '=', $db_restrict_site->id );

        $modifier->join(
          sprintf( '( %s %s ) AS user_join_application ', $join_sel->get_sql(), $join_mod->get_sql() ),
          'user.id',
          'user_join_application.user_id' );
      }
    }

    // add empty values for site_id, role_id, and language_id (they are only used when adding new users so they will be ignored)
    if( $select->has_column( 'site_id' ) ) $select->add_constant( NULL, 'site_id' );
    if( $select->has_column( 'role_id' ) ) $select->add_constant( NULL, 'role_id' );
    if( $select->has_column( 'language_id' ) ) $select->add_constant( NULL, 'language_id' );

    // add the total number of related records (we can't use parent::add_list_column() here)
    if( $select->has_column( 'role_list' ) ||
        $select->has_column( 'site_list' ) ||
        $select->has_column( 'last_access_datetime' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'access' );
      $join_sel->add_column( 'user_id' );
      if( $select->has_column( 'role_list' ) )
        $join_sel->add_column( 'GROUP_CONCAT( DISTINCT role.name ORDER BY role.name SEPARATOR ", " )', 'role_list', false );
      if( $select->has_column( 'site_list' ) )
        $join_sel->add_column( 'GROUP_CONCAT( DISTINCT site.name ORDER BY site.name SEPARATOR ", " )', 'site_list', false );
      if( $select->has_column( 'last_access_datetime' ) )
        $join_sel->add_column( 'MAX( access.datetime )', 'last_access_datetime', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->join( 'role', 'access.role_id', 'role.id' );
      $join_mod->join( 'site', 'access.site_id', 'site.id' );
      $join_mod->group( 'user_id' );

      // restrict to roles belonging to this application
      $sub_mod = lib::create( 'database\modifier' );
      $join_mod->join( 'application_type_has_role', 'access.role_id', 'application_type_has_role.role_id' );
      $join_mod->where( 'application_type_has_role.application_type_id', '=', $db_application->application_type_id );

      // restrict to current site if role is not all-sites based
      if( !$db_role->all_sites ) $join_mod->where( 'access.site_id', '=', $db_site->id );

      $modifier->left_join(
        sprintf( '( %s %s ) AS user_join_access', $join_sel->get_sql(), $join_mod->get_sql() ),
        'user.id',
        'user_join_access.user_id' );

      // override columns so that we can fake these columns being in the user table
      if( $select->has_column( 'role_list' ) )
        $select->add_column( 'IFNULL( role_list, 0 )', 'role_list', false );
      if( $select->has_column( 'site_list' ) )
        $select->add_column( 'IFNULL( site_list, 0 )', 'site_list', false );
      if( $select->has_column( 'last_access_datetime' ) )
        $select->add_column( 'user_join_access.last_access_datetime', 'last_access_datetime', false );
    }

    // add active access (site/role) details if requested
    if( $select->has_table_columns( 'activity' ) ||
        $select->has_table_columns( 'access' ) ||
        $select->has_table_columns( 'site' ) ||
        $select->has_table_columns( 'role' ) )
    {
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'user.id', '=', 'activity.user_id', false );
      $join_mod->where( 'activity.end_datetime', '=', NULL );
      $join_mod->where( 'activity.application_id', '=', $db_application->id );
      $modifier->join_modifier( 'activity', $join_mod, 'left' );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'activity.user_id', '=', 'access.user_id', false );
      $join_mod->where( 'activity.site_id', '=', 'access.site_id', false );
      $join_mod->where( 'activity.role_id', '=', 'access.role_id', false );
      $modifier->join_modifier( 'access', $join_mod, 'left' );

      if( $select->has_table_columns( 'site' ) )
        $modifier->left_join( 'site', 'activity.site_id', 'site.id' );
      if( $select->has_table_columns( 'role' ) )
        $modifier->left_join( 'role', 'activity.role_id', 'role.id' );

      // make sure to restrict to the activity's site
      if( is_null( $this->get_resource() ) )
      {
        $db_restrict_site = $this->get_restricted_site();
        if( !is_null( $db_restrict_site ) )
          $modifier->where(
            sprintf( 'IFNULL( activity.site_id, %d )', $db_restrict_site->id ), '=', $db_restrict_site->id );
      }

    }

    if( $setting_manager->get_setting( 'module', 'interview' ) )
    {
      // add the current assignment
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'user.id', '=', 'assignment.user_id', false );
      $join_mod->where( 'assignment.end_datetime', '=', NULL );
      $modifier->join_modifier( 'assignment', $join_mod, 'left' );
      $modifier->left_join( 'interview', 'assignment.interview_id', 'interview.id' );
      $modifier->left_join( 'participant', 'interview.participant_id', 'participant.id' );
      $select->add_column( 'IFNULL( participant.uid, "none" )', 'assignment_uid', false );
    }

    if( $select->has_column( 'in_call' ) )
    {
      if( !$setting_manager->get_setting( 'module', 'voip' ) )
      {
        $select->add_constant( NULL, 'in_call' );
      }
      else
      {
        try
        {
          $voip_manager = lib::create( 'business\voip_manager' );
          $voip_manager->rebuild_call_list();
          $user_list = array_reduce( $voip_manager->get_call_list(), function( $list, $voip_call ) {
            if( 'Up' == $voip_call->get_state() )
            {
              $user = $voip_call->get_user();
              if( !is_null( $user ) ) array_push( $list, $user );
            }
            return $list;
          }, array() );
          sort( $user_list );
          $in_call_list = 0 < count( $user_list ) ? implode( ',', $user_list ) : '0';
          $select->add_column( sprintf( 'user.id IN ( %s )', $in_call_list ), 'in_call', false );
        }
        catch( \cenozo\exception\runtime $e )
        {
          $select->add_constant( NULL, 'in_call' );
        }
      }
    }

    if( $select->has_column( 'webphone' ) )
    {
      if( !$setting_manager->get_setting( 'module', 'voip' ) )
      {
        $select->add_constant( NULL, 'webphone' );
      }
      else
      {
        try
        {
          $voip_manager = lib::create( 'business\voip_manager' );
          $user_list = array_reduce( $voip_manager->get_sip_info_list(), function( $list, $sip_info ) {
            if( 'OK' == substr( $sip_info['status'], 0, 2 ) ) array_push( $list, $sip_info['user'] );
            return $list;
          }, array() );
          sort( $user_list );
          $webphone_list = 0 < count( $user_list ) ? implode( ',', $user_list ) : '0';
          $select->add_column( sprintf( 'user.id IN ( %s )', $webphone_list ), 'webphone', false );
        }
        catch( \cenozo\exception\runtime $e )
        {
          $select->add_constant( NULL, 'webphone' );
        }
      }
    }
  }
}

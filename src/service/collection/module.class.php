<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\collection;
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

    if( $this->service->may_continue() )
    {
      $service_class_name = lib::get_class_name( 'service\service' );
      $collection_class_name = lib::get_class_name( 'database\collection' );
      $session = lib::create( 'business\session' );
      $db_user = $session->get_user();
      $db_collection = $this->get_resource();
      $method = $this->get_method();

      // restrict by application (if ID is null then this is a new collection, so don't bother checking)
      if( !is_null( $db_collection ) && !is_null( $db_collection->id ) )
      {
        if( 0 < $db_collection->get_application_count() )
        {
          $modifier = lib::create( 'database\modifier' );
          $modifier->where( 'application.id', '=', $session->get_application()->id );
          if( 0 == $db_collection->get_application_count( $modifier ) )
          {
            $this->get_status()->set_code( 404 );
            return;
          }
        }
      }

      // don't allow modifying a locked collection
      if( 'POST' == $method && ( !$this->is_leaf_module() || $this->get_parent_subject() ) )
      {
        $check_locked = true;
        if( is_null( $db_collection ) )
        {
          // make sure no collection being added or removed are locked
          $obj = $this->get_file_as_object();
          $id_list = array();
          foreach( $obj as $list ) $id_list = array_merge( $id_list, $list );

          if( 0 < count( $id_list ) )
          {
            // determine if the user doesn't have access to any locked collections in the list
            $collection_mod = lib::create( 'database\modifier' );
            $join_mod = lib::create( 'database\modifier' );
            $join_mod->where( 'collection.id', '=', 'user_has_collection.collection_id', false );
            $join_mod->where( 'user_id', '=', $db_user->id );
            $collection_mod->join_modifier( 'user_has_collection', $join_mod, 'left' );
            $collection_mod->where( 'collection.id', 'IN', $id_list );
            $collection_mod->where( 'collection.locked', '=', true );
            $collection_mod->where( 'user_id', '=', NULL );
            if( 0 < $collection_class_name::count( $collection_mod ) )
            {
              $this->get_status()->set_code( 403 );
              return;
            }
          }
        }
      }

      if( !is_null( $db_collection ) && $service_class_name::is_write_method( $method ) )
      {
        if( $db_collection->locked )
        {
          // see if user has collection, if not then 403
          $user_mod = lib::create( 'database\modifier' );
          $user_mod->where( 'user.id', '=', $db_user->id );
          if( 0 == $db_collection->get_user_count( $user_mod ) ) $this->get_status()->set_code( 403 );
        }
      }
    }
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $db_application = lib::create( 'business\session' )->get_application();

    if( false === $this->get_argument( 'choosing', false ) )
    {
      // left join to application since it may be null
      $modifier->left_join(
        'application_has_collection', 'collection.id', 'application_has_collection.collection_id' );
      $column = sprintf( 'IFNULL( application_has_collection.application_id, %d )', $db_application->id );
      $modifier->where( $column, '=', $db_application->id );
    }

    // add the total number of participants
    if( $select->has_column( 'participant_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'collection' );
      $join_sel->add_column( 'id', 'collection_id' );
      $join_sel->add_column(
        'IF( collection_has_participant.participant_id IS NOT NULL, COUNT(*), 0 )',
        'participant_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->left_join(
        'collection_has_participant', 'collection.id', 'collection_has_participant.collection_id' );
      $join_mod->group( 'collection.id' );

      // restrict to participants in this application
      if( $db_application->release_based )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'collection_has_participant.participant_id', '=',
                         'application_has_participant.participant_id', false );
        $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
        $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
        $join_mod->join_modifier( 'application_has_participant', $sub_mod );
      }

      // restrict by site
      $db_restrict_site = $this->get_restricted_site();
      if( !is_null( $db_restrict_site ) )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'collection_has_participant.participant_id', '=',
                         'participant_site.participant_id', false );
        $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
        $sub_mod->where( 'participant_site.site_id', '=', $db_restrict_site->id );
        $join_mod->join_modifier( 'participant_site', $sub_mod );
      }

      $modifier->left_join(
        sprintf( '( %s %s ) AS collection_join_participant', $join_sel->get_sql(), $join_mod->get_sql() ),
        'collection.id',
        'collection_join_participant.collection_id' );
      $select->add_column( 'IFNULL( participant_count, 0 )', 'participant_count', false );
    }

    // add the total number of users
    if( $select->has_column( 'user_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'user_has_collection' );
      $join_sel->add_column( 'collection_id' );
      $join_sel->add_column( 'COUNT( DISTINCT user_has_collection.user_id )', 'user_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->group( 'collection_id' );

      // restrict to users who have access to this application
      $join_mod->join( 'access', 'user_has_collection.user_id', 'access.user_id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS collection_join_user', $join_sel->get_sql(), $join_mod->get_sql() ),
        'collection.id',
        'collection_join_user.collection_id' );
      $select->add_column( 'IFNULL( user_count, 0 )', 'user_count', false );
    }
  }
}

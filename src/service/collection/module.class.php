<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
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

    $collection_class_name = lib::get_class_name( 'database\collection' );
    $db_user = lib::create( 'business\session' )->get_user();

    // don't allow modifying a locked collection
    $db_collection = NULL;
    if( 'DELETE' == $this->get_method() || 'PATCH' == $this->get_method() )
      $db_collection = $this->get_resource();
    else if( 'POST' == $this->get_method() && ( !$this->is_leaf_module() || $this->get_parent_subject() ) )
    {
      // make sure the collection isn't locked
      $db_collection = $this->get_resource();
      if( is_null( $db_collection ) )
      {
        // we're replacing the list of collections, make sure we're not adding or removing any locked
        // collections that the user doesn't have access to
        $select = lib::create( 'database\select' );
        $select->add_column( 'id' );
        $existing_list = array();
        foreach( $this->get_parent_resource()->get_collection_list( $select ) as $row )
          $existing_list[] = $row['id'];
        $replacement_list = $this->get_file_as_object();
        $xor_list = array_merge(
          array_diff( $existing_list, $replacement_list ),
          array_diff( $replacement_list, $existing_list ) );
        if( 0 < count( $xor_list ) )
        {
          // determine if the user doesn't have access to any locked collections in the list
          $collection_mod = lib::create( 'database\modifier' );
          $join_mod = lib::create( 'database\modifier' );
          $join_mod->where( 'collection.id', '=', 'user_has_collection.collection_id', false );
          $join_mod->where( 'user_id', '=', $db_user->id );
          $collection_mod->join_modifier( 'user_has_collection', $join_mod, 'left' );
          $collection_mod->where( 'collection.id', 'IN', $xor_list );
          $collection_mod->where( 'collection.locked', '=', true );
          $collection_mod->where( 'user_id', '=', NULL );
          if( 0 < $collection_class_name::count( $collection_mod ) )
            $this->get_status()->set_code( 403 );
        }
      }
    }

    if( !is_null( $db_collection ) )
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

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $db_application = lib::create( 'business\session' )->get_application();

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
        $join_mod->join_modifier( 'application_has_participant', $sub_mod, 'left' );
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
        $join_mod->join_modifier( 'participant_site', $sub_mod, 'left' );
      }

      $modifier->left_join(
        sprintf( '( %s %s ) AS collection_join_participant', $join_sel->get_sql(), $join_mod->get_sql() ),
        'collection.id',
        'collection_join_participant.collection_id' );
      $select->add_column( 'participant_count', 'participant_count', false );
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

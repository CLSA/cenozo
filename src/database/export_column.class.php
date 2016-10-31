<?php
/**
 * export_column.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * export_column: record
 */
class export_column extends has_rank
{
  /**
   * Applies this record's changes to the given select
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\select $select
   * @access public
   */
  public function apply_select( $select )
  {
    if( $this->include )
    {
      $table_name = $this->get_table_alias();
      $column_name = $this->column_name;
      $column_alias = $this->get_column_alias();
      $table_prefix = true;
      $type = NULL;
      if( 'application' == $this->table_name )
      {
        $table_name = str_replace( 'application', 'application_has_participant', $table_name );
      }
      else if( 'auxiliary' == $this->table_name )
      {
        if( in_array( $this->column_name, array( 'has_alternate', 'has_informant', 'has_proxy' ) ) )
        {
          $column_name = sprintf( 'IF( %s, "yes", "no" )', $this->column_name );
          $table_prefix = false;
        }
      }

      $select->add_table_column( $table_name, $column_name, $column_alias, $table_prefix, $type );
    }
  }

  /**
   * Applies this record's changes to the given modifier
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier
   * @access public
   */
  public function apply_modifier( $modifier )
  {
    $application_id = lib::create( 'business\session' )->get_application()->id;
    
    $table_name = $this->get_table_alias();
    if( 'address' == $this->table_name )
    {
      if( 'primary' == $this->subtype )
      {
        if( !$modifier->has_join( $table_name ) )
        {
          if( !$modifier->has_join( 'participant_primary_address' ) )
            $modifier->join(
              'participant_primary_address', 'participant.id', 'participant_primary_address.participant_id' );
          $modifier->left_join(
            'address', 'participant_primary_address.address_id', $table_name.'.id', $table_name );
        }
      }
      else if( 'first' == $this->subtype )
      {
        if( !$modifier->has_join( $table_name ) )
        {
          if( !$modifier->has_join( 'participant_first_address' ) )
            $modifier->join(
              'participant_first_address', 'participant.id', 'participant_first_address.participant_id' );
          $modifier->left_join(
            'address', 'participant_first_address.address_id', $table_name.'.id', $table_name );
        }
      }
    }
    else if( 'application' == $this->table_name )
    {
      if( !$modifier->has_join( $table_name ) )
      {
        $joining_table_name = 'application_has_participant_'.$this->subtype;
        if( !$modifier->has_join( $joining_table_name ) )
        {
          $join_mod = lib::create( 'database\modifier' );
          $join_mod->where( 'participant.id', '=', $joining_table_name.'.participant_id', false );
          $join_mod->where( $joining_table_name.'.application_id', '=', $this->subtype );
          $modifier->join_modifier( 'application_has_participant', $join_mod, 'left', $joining_table_name );
        }
        $modifier->left_join(
          'application', $joining_table_name.'.application_id', $table_name.'.id', $table_name );
      }
    }
    else if( 'auxiliary' == $this->table_name )
    {
      if( !$modifier->has_join( $table_name ) )
      {
        if( in_array( $this->column_name, array( 'has_alternate', 'has_informant', 'has_proxy' ) ) )
        {
          $sub_table_sel = lib::create( 'database\select' );
          $sub_table_sel->from( 'participant' );
          $sub_table_sel->add_column( 'id', 'participant_id' );
          $sub_table_sel->add_column( 'alternate.id IS NOT NULL', $this->column_name, false );
          $sub_table_mod = lib::create( 'database\modifier' );
          $join_mod = lib::create( 'database\modifier' );
          $join_mod->where( 'participant.id', '=', 'alternate.participant_id', false );
          $join_mod->where( substr( $this->column_name, 4 ), '=', true );
          $sub_table_mod->join_modifier( 'alternate', $join_mod, 'left' );

          $modifier->join(
            sprintf( '(%s %s)', $sub_table_sel->get_sql(), $sub_table_mod->get_sql() ),
            'participant.id',
            $table_name.'.participant_id',
            '',
            $table_name
          );
        }
      }
    }
    else if( 'consent' == $this->table_name )
    {
      if( !$modifier->has_join( $table_name ) )
      {
        $joining_table_name = 'participant_last_consent_'.$this->subtype;
        if( !$modifier->has_join( $joining_table_name ) )
        {
          $join_mod = lib::create( 'database\modifier' );
          $join_mod->where( 'participant.id', '=', $joining_table_name.'.participant_id', false );
          $join_mod->where( $joining_table_name.'.consent_type_id', '=', $this->subtype );
          $modifier->join_modifier( 'participant_last_consent', $join_mod, '', $joining_table_name );
        }
        $modifier->left_join( 'consent', $joining_table_name.'.consent_id', $table_name.'.id', $table_name );
      }
    }
    else if( 'event' == $this->table_name )
    {
      if( !$modifier->has_join( $table_name ) )
      {
        $joining_table_name = 'participant_last_event_'.$this->subtype;
        if( !$modifier->has_join( $joining_table_name ) )
        {
          $join_mod = lib::create( 'database\modifier' );
          $join_mod->where( 'participant.id', '=', $joining_table_name.'.participant_id', false );
          $join_mod->where( $joining_table_name.'.event_type_id', '=', $this->subtype );
          $modifier->join_modifier( 'participant_last_event', $join_mod, '', $joining_table_name );
        }
        $modifier->left_join( 'event', $joining_table_name.'.event_id', $table_name.'.id', $table_name );
      }
    }
    else if( 'site' == $this->table_name )
    {
      // there may be an application id in the subtype
      $subtype = $this->subtype;
      $matches = array();
      if( preg_match( '/^([a-z]+)_([0-9]+)$/', $this->subtype, $matches ) )
      {
        $subtype = $matches[1];
        $application_id = $matches[2];
      }

      if( 'effective' == $subtype || 'default' == $subtype )
      {
        $column = 'default' == $subtype ? 'default_site_id' : 'site_id';
        if( !$modifier->has_join( $table_name ) )
        {
          if( !$modifier->has_join( 'participant_site' ) )
          {
            $join_mod = lib::create( 'database\modifier' );
            $join_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
            $join_mod->where( 'participant_site.application_id', '=', $application_id );
            $modifier->join_modifier( 'participant_site', $join_mod );
          }
          $modifier->join( 'site', 'participant_site.'.$column, $table_name.'.id', 'left', $table_name );
        }
      }
      else if( 'preferred' == $subtype )
      {
        if( !$modifier->has_join( $table_name ) )
        {
          if( !$modifier->has_join( 'application_has_participant' ) )
          {
            $join_mod = lib::create( 'database\modifier' );
            $join_mod->where( 'participant.id', '=', 'application_has_participant.participant_id', false );
            $join_mod->where( 'application_has_participant.application_id', '=', $application_id );
            $modifier->join_modifier( 'application_has_participant', $join_mod );
          }
          $modifier->left_join(
            'site', 'application_has_participant.preferred_site_id', $table_name.'.id', $table_name );
        }
      }
    }
  }

  /**
   * Returns the alias used when referencing this object's table
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function get_table_alias()
  {
    if( 'auxiliary' == $this->table_name )
    {
      if( in_array( $this->column_name, array( 'has_alternate', 'has_informant', 'has_proxy' ) ) )
      {
        return 'participant_'.$this->column_name;
      }
    }
    else if( is_null( $this->subtype ) )
    {
      return $this->table_name;
    }
    else if( 'site' == $this->table_name || 'address' == $this->table_name )
    {
      return $this->subtype.'_'.$this->table_name;
    }

    return $this->table_name.'_'.$this->subtype;
  }

  /**
   * Returns the alias used when referencing this object's table
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function get_column_alias()
  {
    $alias_parts = array( $this->table_name, $this->column_name );

    if( 'address' == $this->table_name )
    {
      array_unshift( $alias_parts, $this->subtype );
    }
    else if( 'application' == $this->table_name )
    {
      // remove the table name
      array_shift( $alias_parts );
      // add "release" if the column name is datetime
      if( 'datetime' == $this->column_name ) array_unshift( $alias_parts, 'release' );
      // add the application title
      array_unshift( $alias_parts, lib::create( 'database\application', $this->subtype )->title );
    }
    else if( 'auxiliary' == $this->table_name )
    {
      $alias_parts = explode( '_', $this->column_name );
    }
    else if( 'consent' == $this->table_name )
    {
      // get the consent type name
      array_unshift( $alias_parts, lib::create( 'database\consent_type', $this->subtype )->name );
    }
    else if( 'event' == $this->table_name )
    {
      // get the event type name
      array_unshift( $alias_parts, lib::create( 'database\event_type', $this->subtype )->name );
    }
    else if( 'site' == $this->table_name )
    {
      // there may be an application id in the subtype
      $subtype = $this->subtype;
      $matches = array();
      if( preg_match( '/^([a-z]+)_([0-9]+)$/', $this->subtype, $matches ) )
        $subtype = lib::create( 'database\application', $matches[2] )->title.': '.$matches[1];
      array_unshift( $alias_parts, $subtype );
    }

    return ucWords( str_replace( '_', ' ', implode( ' ', $alias_parts ) ) );
  }

  /**
   * The type of record which the record has a rank for.
   * @var string
   * @access protected
   * @static
   */
  protected static $rank_parent = 'export';
}

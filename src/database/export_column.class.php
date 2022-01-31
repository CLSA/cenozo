<?php
/**
 * export_column.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @param database\select $select
   * @access public
   */
  public function apply_select( $select )
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );

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
        $check_array = array( 'has_alternate', 'has_decedent', 'has_emergency', 'has_informant', 'has_proxy' );
        if( in_array( $this->column_name, $check_array ) )
        {
          $column_name = sprintf( 'IF( %s.total, "yes", "no" )', $this->column_name );
          $table_prefix = false;
        }
      }
      else if( 'participant' == $this->table_name && 'status' == $column_name )
      {
        // participant.status is a pseudo-column
        $column_name = $participant_class_name::get_status_column_sql();
        $table_prefix = false;
      }

      // replace foreign key IDs with the name from the foreign table
      if( '_id' == substr( $column_name, -3 ) )
      {
        $sub_table_name = substr( $column_name, 0, -3 );
        $table_name .= '_'.$sub_table_name;
        $column_name = 'name';
        $table_prefix = true;
      }

      if( $table_prefix ) $column_name = $table_name.'.'.$column_name;
      $select->add_column( $column_name, $column_alias, false, $type );
    }
  }

  /**
   * Applies this record's changes to the given modifier
   * 
   * @param database\modifier $modifier
   * @access public
   */
  public function apply_modifier( $modifier )
  {
    $alternate_type_class_name = lib::get_class_name( 'database\alternate_type' );
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
      $check_array = array( 'has_alternate', 'has_decedent', 'has_emergency', 'has_informant', 'has_proxy' );
      if( in_array( $this->column_name, $check_array ) )
      {
        $alternate_type = substr( $this->column_name, 4 );
        $join_table_name = $this->column_name;
        if( !$modifier->has_join( $join_table_name ) )
        {
          $alternate_sel = lib::create( 'database\select' );
          $alternate_sel->from( 'participant' );
          $alternate_sel->add_column( 'id', 'participant_id' );
          $alternate_mod = lib::create( 'database\modifier' );
          $alternate_mod->left_join( 'alternate', 'participant.id', 'alternate.participant_id' );

          if( 'alternate' != $alternate_type )
          {
            $db_alternate_type = $alternate_type_class_name::get_unique_record( 'name', $alternate_type );
            $alternate_type_table_name = sprintf( 'alternate_has_%s_alternate_type', $alternate_type );
            $join_mod = lib::create( 'database\modifier' );
            $join_mod->where( 'alternate.id', '=', sprintf( '%s.alternate_id', $alternate_type_table_name ), false );
            $join_mod->where( sprintf( '%s.alternate_type_id', $alternate_type_table_name ), '=', $db_alternate_type->id );
            $alternate_mod->join_modifier( 'alternate_has_alternate_type', $join_mod, 'left', $alternate_type_table_name );
            $alternate_sel->add_column(
              sprintf( 'SUM( IF( %s.alternate_id IS NULL, 0, 1 ) )', $alternate_type_table_name ),
              'total',
              false
            );
          }
          else
          {
            $alternate_sel->add_column( 'SUM( IF( alternate.id IS NULL, 0, 1 ) )', 'total', false );
          }

          $alternate_mod->group( 'participant.id' );
          $alternate_mod->order( 'participant.id' );

          $sql = sprintf(
            'CREATE TEMPORARY TABLE IF NOT EXISTS %s ('."\n".
            '  participant_id INT UNSIGNED NOT NULL,'."\n".
            '  total INT UNSIGNED NOT NULL,'."\n".
            '  PRIMARY KEY( participant_id )'."\n".
            ')'."\n".
            '%s %s',
            $join_table_name,
            $alternate_sel->get_sql(),
            $alternate_mod->get_sql()
          );
          static::db()->execute( $sql );
          $modifier->join( $join_table_name, 'participant.id', $join_table_name.'.participant_id' );
        }
      }
    }
    else if( 'collection' == $this->table_name )
    {
      if( !$modifier->has_join( $table_name ) )
      {
        $joining_table_name = 'collection_has_participant_'.$this->subtype;
        if( !$modifier->has_join( $joining_table_name ) )
        {
          $join_mod = lib::create( 'database\modifier' );
          $join_mod->where( 'participant.id', '=', $joining_table_name.'.participant_id', false );
          $join_mod->where( $joining_table_name.'.collection_id', '=', $this->subtype );
          $modifier->join_modifier( 'collection_has_participant', $join_mod, '', $joining_table_name );
        }
        $modifier->left_join( 'collection', $joining_table_name.'.collection_id', $table_name.'.id', $table_name );
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
    else if( 'hin' == $this->table_name )
    {
      if( !$modifier->has_join( 'hin' ) )
      {
        if( !$modifier->has_join( 'participant_last_hin' ) )
          $modifier->join( 'participant_last_hin', 'participant.id', 'participant_last_hin.participant_id' );
        $modifier->left_join( 'hin', 'participant_last_hin.hin_id', 'hin.id' );
      }
    }
    else if( 'interview' == $this->table_name )
    {
      if( !$modifier->has_join( $table_name ) )
      {
        $join_mod = lib::create( 'database\modifier' );
        $join_mod->where( 'participant.id', '=', $table_name.'.participant_id', false );
        $join_mod->where( $table_name.'.qnaire_id', '=', $this->subtype );
        $modifier->join_modifier( 'interview', $join_mod, 'left', $table_name );
      }
    }
    else if( 'hold' == $this->table_name ||
             'proxy' == $this->table_name ||
             'trace' == $this->table_name ||
             ( 'participant' == $this->table_name && 'status' == $this->column_name ) )
    {
      if( 'participant' == $this->table_name )
        if( !$modifier->has_join( 'exclusion' ) )
          $modifier->left_join( 'exclusion', 'participant.exclusion_id', 'exclusion.id' );

      if( 'hold' == $this->table_name || 'participant' == $this->table_name )
      {
        if( !$modifier->has_join( 'hold' ) )
        {
          if( !$modifier->has_join( 'participant_last_hold' ) )
            $modifier->join( 'participant_last_hold', 'participant.id', 'participant_last_hold.participant_id' );
          $modifier->left_join( 'hold', 'participant_last_hold.hold_id', 'hold.id' );
          $modifier->left_join( 'hold_type', 'hold.hold_type_id', 'hold_type.id' );
        }
      }

      if( 'proxy' == $this->table_name || 'participant' == $this->table_name )
      {
        if( !$modifier->has_join( 'proxy' ) )
        {
          if( !$modifier->has_join( 'participant_last_proxy' ) )
            $modifier->join( 'participant_last_proxy', 'participant.id', 'participant_last_proxy.participant_id' );
          $modifier->left_join( 'proxy', 'participant_last_proxy.proxy_id', 'proxy.id' );
          $modifier->left_join( 'proxy_type', 'proxy.proxy_type_id', 'proxy_type.id' );
        }
      }

      if( 'trace' == $this->table_name || 'participant' == $this->table_name )
      {
        if( !$modifier->has_join( 'trace' ) )
        {
          if( !$modifier->has_join( 'participant_last_trace' ) )
            $modifier->join( 'participant_last_trace', 'participant.id', 'participant_last_trace.participant_id' );
          $modifier->left_join( 'trace', 'participant_last_trace.trace_id', 'trace.id' );
          $modifier->left_join( 'trace_type', 'trace.trace_type_id', 'trace_type.id' );
        }
      }
    }
    else if( 'participant_identifier' == $this->table_name )
    {
      if( !$modifier->has_join( $table_name ) )
      {
        $joining_table_name = 'participant_identifier_'.$this->subtype;
        if( !$modifier->has_join( $joining_table_name ) )
        {
          $join_mod = lib::create( 'database\modifier' );
          $join_mod->where( 'participant.id', '=', $joining_table_name.'.participant_id', false );
          $join_mod->where( $joining_table_name.'.identifier_id', '=', $this->subtype );
          $modifier->join_modifier( 'participant_identifier', $join_mod, 'left', $joining_table_name );
        }
      }
    }
    else if( 'phone' == $this->table_name )
    {
      if( !$modifier->has_join( 'phone' ) )
      {
        $join_mod = lib::create( 'database\modifier' );
        $join_mod->where( 'participant.id', '=', 'phone.participant_id', false );
        $join_mod->where( 'phone.rank', '=', 1 );
        $modifier->join_modifier( 'phone', $join_mod, 'left' );
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

    if( $this->include )
    {
      // join to the foreign table when the column is a foreign key
      if( '_id' == substr( $this->column_name, -3 ) )
      {
        $sub_table_name = substr( $this->column_name, 0, -3 );
        $joining_table_name = $table_name.'_'.$sub_table_name;
        if( !$modifier->has_join( $joining_table_name ) )
        {
          $modifier->join(
            $sub_table_name,
            $table_name.'.'.$this->column_name,
            $joining_table_name.'.id',
            'left',
            $joining_table_name
          );
        }
      }
    }
  }

  /**
   * Returns the alias used when referencing this object's table
   * 
   * @access public
   */
  public function get_table_alias()
  {
    if( 'auxiliary' == $this->table_name )
    {
      $check_array = array( 'has_alternate', 'has_decedent', 'has_emergency', 'has_informant', 'has_proxy' );
      if( in_array( $this->column_name, $check_array ) )
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
   * @access public
   */
  public function get_column_alias()
  {
    $alias_parts = array( $this->table_name, preg_replace( '/_id$/', '', $this->column_name ) );

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
    else if( 'collection' == $this->table_name )
    {
      // get the collection name
      array_unshift( $alias_parts, lib::create( 'database\collection', $this->subtype )->name );
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
    else if( 'participant_identifier' == $this->table_name )
    {
      // get the identifier name
      array_unshift( $alias_parts, lib::create( 'database\identifier', $this->subtype )->name );
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

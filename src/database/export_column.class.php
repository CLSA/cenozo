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
    if( 'site' == $this->table_name )
    {
      if( 'effective' == $this->subtype || 'default' == $this->subtype )
      {
        $column = 'default' == $this->subtype ? 'default_site_id' : 'site_id';
        if( !$modifier->has_join( $table_name ) )
        {
          if( !$modifier->has_join( 'participant_site' ) )
          {
            $join_mod = lib::create( 'database\modifier' );
            $join_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
            $join_mod->where( 'participant_site.application_id', '=', $application_id );
            $modifier->join_modifier( 'participant_site', $join_mod );
          }
          $modifier->join( 'site', 'participant_site.'.$column, $table_name.'.id', '', $table_name );
        }
      }
      else if( 'preferred' == $this->subtype )
      {
        if( !$modifier->has_join( $table_name ) )
        {
          if( !$modifier->has_join( 'application_has_participant' ) )
          {
            $join_mod = lib::create( 'database\modifier' );
            $join_mod->where( 'participant.id', '=', 'application_has_participant.participant_id', false );
            $join_mod->where( 'application_has_participant.application_id', '=', $application_id );
          }
          $modifier->join_modifier( 'application_has_participant', $join_mod );
          $modifier->left_join(
            'site', 'application_has_participant.preferred_site_id', $table_name.'.id', $table_name );
        }
      }
    }
    else if( 'address' == $this->table_name )
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
  }

  /**
   * Returns the alias used when referencing this object's table
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function get_table_alias()
  {
    if( 'participant' == $this->table_name ) return 'participant';
    else if( 'site' == $this->table_name || 'address' == $this->table_name )
      return $this->subtype.'_'.$this->table_name;
    return $this->table_name.'_'.$this->subtype;
  }

  /**
   * The type of record which the record has a rank for.
   * @var string
   * @access protected
   * @static
   */
  protected static $rank_parent = 'export';
}

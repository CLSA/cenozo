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
    
    if( 'site' == $this->table_name )
    {
      $table_name = NULL;
      if( 'effective' == $this->subtype || 'default' == $this->subtype )
      {
        $table_name = $this->subtype.'_site';
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
        $table_name = 'preferred_site';
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
    }
    else if( 'phone' == $this->table_name )
    {
    }
    else if( 'consent' == $this->table_name )
    {
    }
    else if( 'event' == $this->table_name )
    {
    }
  }

  /**
   * Returns the alias used when referencing this column's table
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

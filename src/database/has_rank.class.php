<?php
/**
 * has_rank.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * A base class for all records which have a unique, ordered rank.
 */
abstract class has_rank extends record
{
  /**
   * Overrides the parent class so manage ranks.
   * 
   * If the record has a rank which already exists it will push the current record and all that
   * come after it down by one rank to make room for this one.
   * @access public
   */
  public function save()
  {
    // warn if we are in read-only mode
    if( $this->read_only )
    {
      log::warning( 'Tried to save read-only record.' );
      return;
    }

    $rank_parent_key = is_null( static::$rank_parent ) ? false : static::$rank_parent.'_id';

    // see if there is already another record at the new rank
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'id', '!=', $this->id );
    if( $rank_parent_key ) $modifier->where( $rank_parent_key, '=', $this->$rank_parent_key );
    $modifier->where( 'rank', '=', $this->rank );

    // if a record is found then there is already a record in this slot
    if( 0 < static::count( $modifier ) )
    {
      // check to see if this record is being moved or added to the list
      if( !is_null( $this->id ) )
      { // moving the record, make room
        $modifier = lib::create( 'database\modifier' );
        $modifier->where( 'id', '=', $this->id );
        $current_rank = static::db()->get_one(
          sprintf( 'SELECT rank FROM %s %s',
                   static::get_table_name(),
                   $modifier->get_sql() ) );

        // determine if we are moving the rank forward or backward
        $forward = $current_rank < $this->rank;

        // get all records which are between the record's current and new rank
        $modifier = lib::create( 'database\modifier' );
        if( $rank_parent_key ) $modifier->where( $rank_parent_key, '=', $this->$rank_parent_key );
        $modifier->where( 'rank', $forward ? '>'  : '<' , $current_rank );
        $modifier->where( 'rank', $forward ? '<=' : '>=', $this->rank );
        $modifier->order( 'rank', !$forward );
        $records = static::select_objects( $modifier );

        // temporarily set this record's rank to 0, preserving the new record
        $new_rank = $this->rank;
        $this->rank = 0;
        parent::save();
        $this->rank = $new_rank;

        // and move each of the middle record's rank backward by one
        foreach( $records as $record )
        {
          $record->rank = $record->rank + ( $forward ? -1 : 1 );
          $record->save();
        }
      }
      else
      { // adding the record, make room
        // get all records at this rank and afterwards
        $modifier = lib::create( 'database\modifier' );
        if( $rank_parent_key ) $modifier->where( $rank_parent_key, '=', $this->$rank_parent_key );
        $modifier->where( 'rank', '>=', $this->rank );
        $modifier->order_desc( 'rank' );
        $records = static::select_objects( $modifier );

        // and move their rank forward by one to make room for the new record
        foreach( $records as $record )
        {
          $record->rank++;
          $record->save();
        }
      }
    }

    // finish by saving this record
    parent::save();
  }

  /**
   * Overrides the parent class to manage ranks.
   * 
   * If there are other records after this one then we will fill up the gap caused by deleting this
   * record.
   * @access public
   */
  public function delete()
  {
    // warn if we are in read-only mode
    if( $this->read_only )
    {
      log::warning( 'Tried to delete read-only record.' );
      return;
    }

    // delete the current record
    parent::delete();

    $rank_parent_key = is_null( static::$rank_parent ) ? false : static::$rank_parent.'_id';

    // now get a list of all records that come after this one
    $modifier = lib::create( 'database\modifier' );
    if( $rank_parent_key ) $modifier->where( $rank_parent_key, '=', $this->$rank_parent_key );
    $modifier->where( 'rank', '>=', $this->rank );
    $modifier->order( 'rank' );
    $records = static::select_objects( $modifier );

    // and now decrement the rank for all records from the list above
    foreach( $records as $record )
    {
      $record->rank--;
      $record->save();
    }
  }

  /**
   * The type of record which the record has a rank for.  Leave null if there is no parent.
   * @var string
   * @access protected
   * @static
   */
  protected static $rank_parent = NULL;
}

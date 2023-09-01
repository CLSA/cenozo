<?php
/**
 * equipment_type.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * equipment_type: record
 */
class equipment_type extends record
{
  /**
   * Applies data from a CSV file which defines equipment and loan records.
   * 
   * The data must contain either 3 columns:
   *   serial number,
   *   site name (may be blank)
   *   equipment note (may be blank)
   * 
   * Or 8 columns:
   *   serial number,
   *   site name (may be blank)
   *   equipment note (may be blank)
   *   uid (must be a pre-existing UID)
   *   lost (1/y/yes/true if lost, any other value set lost = false)
   *   start_datetime (YYYY-MM-DD format)
   *   end_datetime (may be blank, YYYY-MM-DD format)
   *   loan_note (may be blank)
   * 
   * @param array $data An array of equipment data
   * @param boolean $apply Whether to apply or evaluate the patch
   * @return stdObject
   */
  public function import_from_array( $data, $apply = false )
  {
    ini_set( 'memory_limit', '1G' );
    set_time_limit( 900 ); // 15 minutes max

    $util_class_name = lib::get_class_name( 'util' );
    $site_class_name = lib::get_class_name( 'database\site' );
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $equipment_class_name = lib::get_class_name( 'database\equipment' );
    $equipment_loan_class_name = lib::get_class_name( 'database\equipment_loan' );

    $result_data = array(
      'equipment' => array(
        'new' => 0,
        'update' => 0
      ),
      'loan' => array(
        'new' => 0,
        'update' => 0
      ),
      'unchanged' => 0,
      'invalid' => []
    );

    foreach( $data as $index => $row )
    {
      $unchanged = true;
      // skip the header row
      if( 0 == $index && 'serial_number' == $row[0] ) continue;

      $serial_number = $row[0];
      $site = $row[1];
      $note = str_replace( '\n', "\n", $row[2] );

      $uid = NULL;
      $lost = NULL;
      $start_datetime_obj = NULL;
      $end_datetime_obj = NULL;
      $loan_note = NULL;

      if( 8 <= count( $row ) )
      {
        $uid = $row[3];
        $lost = preg_match( '/^1|y|yes|true$/', $row[4] );

        if( !$row[5] )
        {
          $result_data['invalid'][] = sprintf(
            'Line %d: start datetime cannot be empty',
            $index + 1,
            $row[5]
          );
          continue;
        }

        try
        {
          $start_datetime_obj = $util_class_name::get_datetime_object( $row[5] );
        }
        catch( \Exception $e )
        {
          $result_data['invalid'][] = sprintf(
            'Line %d: start datetime "%s" is invalid',
            $index + 1,
            $row[5]
          );
          continue;
        }

        try
        {
          $end_datetime_obj = $row[6] ? $util_class_name::get_datetime_object( $row[6] ) : NULL;
        }
        catch( \Exception $e )
        {
          $result_data['invalid'][] = sprintf(
            'Line %d: end datetime "%s" is invalid',
            $index + 1,
            $row[6]
          );
          continue;
        }
        $loan_note = $row[7] ? str_replace( '\n', "\n", $row[7] ) : NULL;
      }

      $create_new_loan = false;
      $edit_existing_loan = false;

      $db_equipment = $equipment_class_name::get_unique_record( 'serial_number', $serial_number );
      $site_id = NULL;
      if( $site )
      {
        $db_site = $site_class_name::get_unique_record( 'name', $site );
        if( is_null( $db_site ) )
        {
          $result_data['invalid'][] = sprintf(
            'Line %d: site name "%s" doesn\'t exist',
            $index + 1,
            $site
          );
          continue;
        }
        $site_id = $db_site->id;
      }

      // see if the loan data has changed
      $db_participant = NULL;
      if( !is_null( $uid ) )
      {
        $db_participant = $participant_class_name::get_unique_record( 'uid', $uid );
        if( is_null( $db_participant ) )
        {
          $result_data['invalid'][] = sprintf(
            'Line %d: invalid UID "%s"',
            $index + 1,
            $uid
          );
          continue;
        }
      }

      if( is_null( $db_equipment ) )
      {
        $db_equipment = lib::create( 'database\equipment' );
        $db_equipment->equipment_type_id = $this->id;
        $db_equipment->serial_number = $serial_number;
        $result_data['equipment']['new']++;
        $unchanged = false;
      }
      else if( $this->id != $db_equipment->equipment_type_id )
      {
        $result_data['invalid'][] = sprintf(
          'Line %d: serial number "%s" already exists and belongs to another equipment type (%s)',
          $index + 1,
          $serial_number,
          $db_equipment->get_equipment_type()->name
        );
        continue;
      }
      else if( $site_id != $db_equipment->site_id || $note != $db_equipment->note )
      {
        $result_data['equipment']['update']++;
        $unchanged = false;
      }

      $db_equipment->site_id = $site_id;
      $db_equipment->note = $note;
      if( $apply ) $db_equipment->save();

      if( !is_null( $db_participant ) )
      {
        $equipment_loan_mod = lib::create( 'database\modifier' );
        $equipment_loan_mod->where( 'end_datetime', '=', NULL );
        $list = $db_equipment->get_equipment_loan_object_list( $equipment_loan_mod );
        $db_equipment_loan = 0 < count( $list ) ? current( $list ) : NULL;

        if( is_null( $db_equipment_loan ) )
        {
          // no loan exists, so add a new one
          $create_new_loan = true;
        }
        else if( $uid != $db_equipment_loan->get_participant()->uid )
        {
          // a loan exists but it doesn't match the UID, so close it (if open) and create a new loan
          if( is_null( $db_equipment_loan->end_datetime ) ) $edit_existing_loan = true;
          $create_new_loan = true;
        }
        else // a loan exists and it matches the UID
        {
          // Update the loan if the start, end or note isn't the same as the data
          if(
            $start_datetime_obj != $db_equipment_loan->start_datetime ||
            $end_datetime_obj != $db_equipment_loan->end_datetime ||
            $loan_note != $db_equipment_loan->note
          ) {
            $edit_existing_loan = true;
          }
        }

        if( $edit_existing_loan )
        {
          if( $apply )
          {
            $db_equipment_loan->lost = $lost;
            $db_equipment_loan->start_datetime = $start_datetime_obj;
            $db_equipment_loan->end_datetime = $end_datetime_obj;
            $db_equipment_loan->note = $loan_note;
            $db_equipment_loan->save();
          }
          $result_data['loan']['update']++;
          $unchanged = false;
        }

        if( $create_new_loan )
        {
          if( $apply )
          {
            $db_equipment_loan = lib::create( 'database\equipment_loan' );
            $db_equipment_loan->participant_id = $db_participant->id;
            $db_equipment_loan->equipment_id = $db_equipment->id;
            $db_equipment_loan->lost = $lost;
            $db_equipment_loan->start_datetime = $start_datetime_obj;
            $db_equipment_loan->end_datetime = $end_datetime_obj;
            $db_equipment_loan->note = $loan_note;
            $db_equipment_loan->save();
          }
          $result_data['loan']['new']++;
          $unchanged = false;
        }
      }

      // increment whether new equipment was created, a loan updated, or nothing changed
      if( $unchanged ) $result_data['unchanged']++;
    }

    return (object)$result_data;
  }
}

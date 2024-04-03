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
   * The data must contain either 3-4 columns:
   *   serial number
   *   active (optional, may be blank, default is "true")
   *   site name (optional, may be blank)
   *   equipment note (optional, may be blank)
   * 
   * Or 8-9 columns:
   *   serial number,
   *   active (optional, may be blank, default is "true")
   *   site name (optional, may be blank)
   *   equipment note (optional, may be blank)
   *   uid (mandatory, must be a pre-existing UID)
   *   lost (mandatory, 1/y/yes/true if lost, any other value set lost = false)
   *   start_datetime (mandatory, YYYY-MM-DD format)
   *   end_datetime (optional, may be blank, YYYY-MM-DD format)
   *   loan_note (optional, may be blank)
   * 
   * @param array $data An array of equipment data
   * @param boolean $apply Whether to apply or evaluate the patch
   * @return stdObject
   */
  public function import_from_array( $data, $apply = false )
  {
    ini_set( 'memory_limit', '-1' );
    set_time_limit( 900 ); // 15 minutes max

    $util_class_name = lib::get_class_name( 'util' );
    $site_class_name = lib::get_class_name( 'database\site' );
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $equipment_class_name = lib::get_class_name( 'database\equipment' );
    $equipment_loan_class_name = lib::get_class_name( 'database\equipment_loan' );

    $result_data = [
      'equipment' => [
        'new' => 0,
        'update' => 0
      ],
      'loan' => [
        'new' => 0,
        'update' => 0
      ],
      'unchanged' => 0,
      'invalid' => []
    ];
    $columns = [];

    foreach( $data as $rindex => $row )
    {
      $unchanged = true;
      // read the header row
      if( 0 == $rindex )
      {
        $columns = $row;
        foreach( $columns as $cindex => $column ) $columns[$cindex] = trim( $column, '\'" ' );
        continue;
      }

      // default row data values
      $row_data = [
        'active' => true,
        'serial_number' => NULL,
        'site' => NULL,
        'note' => NULL,
        'uid' => NULL,
        'lost' => NULL,
        'start_datetime' => NULL,
        'end_datetime' => NULL,
        'loan_note' => NULL,
      ];

      foreach( $columns as $cindex => $column )
      {
        // ignore empty values (the default, set above, will be used)
        if( is_null( $row[$cindex] ) ) continue;

        if( 'serial_number' == $column ) $row_data['serial_number'] = $row[$cindex];
        else if( 'site' == $column ) $row_data['site'] = $row[$cindex];
        else if( 'uid' == $column ) $row_data['uid'] = $row[$cindex];
        else if( 'active' == $column )
        {
          $row_data['active'] = $row_data['active'] = $row[$cindex];
          if( is_string( $row_data['active'] ) )
            $row_data['active'] = preg_match( '/^1|y|yes|true$/', $row_data['active'] );
        }
        else if( 'lost' == $column )
        {
          $row_data['lost'] = $row_data['lost'] = $row[$cindex];
          if( is_string( $row_data['lost'] ) )
            $row_data['lost'] = preg_match( '/^1|y|yes|true$/', $row_data['lost'] );
        }
        else if( 'note' == $column && $row[$cindex] )
        {
          $row_data['note'] = str_replace( '\n', "\n", $row[$cindex] );
        }
        else if( 'loan_note' == $column && $row[$cindex] )
        {
          $row_data['loan_note'] = str_replace( '\n', "\n", $row[$cindex] );
        }
        else if( 'start_datetime' == $column )
        {
          try
          {
            $row_data['start_datetime'] = $util_class_name::get_datetime_object( $row[$cindex] );
          }
          catch( \Exception $e )
          {
            $result_data['invalid'][] = sprintf(
              'Line %d: start datetime "%s" is invalid',
              $rindex + 1,
              $row[$cindex]
            );
            continue;
          }
        }
        else if( 'end_datetime' == $column && $row[$cindex] )
        {
          try
          {
            $row_data['end_datetime'] = $util_class_name::get_datetime_object( $row[$cindex] );
          }
          catch( \Exception $e )
          {
            $result_data['invalid'][] = sprintf(
              'Line %d: end datetime "%s" is invalid',
              $rindex + 1,
              $row[$cindex]
            );
            continue;
          }
        }
        // ignore columns with invalid names
      }

      // now check that all mandatory data is valid
      if( is_null( $row_data['serial_number'] ) )
      {
        $result_data['invalid'][] = sprintf( 'Line %d: serial number cannot be empty', $rindex + 1, $row[$cindex] );
        continue;
      }

      // only check for uid/lost/start_datetime data if any of those columns are included in the header
      if( 0 < count( array_intersect( $columns, ['uid', 'lost', 'start_datetime'] ) ) )
      {
        if( is_null( $row_data['uid'] ) )
        {
          $result_data['invalid'][] = sprintf( 'Line %d: uid cannot be empty', $rindex + 1, $row[$cindex] );
          continue;
        }

        if( is_null( $row_data['lost'] ) )
        {
          $result_data['invalid'][] = sprintf( 'Line %d: lost cannot be empty', $rindex + 1, $row[$cindex] );
          continue;
        }

        if( is_null( $row_data['start_datetime'] ) )
        {
          $result_data['invalid'][] = sprintf( 'Line %d: start datetime cannot be empty', $rindex + 1, $row[$cindex] );
          continue;
        }
      }

      $create_new_loan = false;
      $edit_existing_loan = false;

      $db_equipment = $equipment_class_name::get_unique_record( 'serial_number', $row_data['serial_number'] );
      $site_id = NULL;
      if( $row_data['site'] )
      {
        $db_site = $site_class_name::get_unique_record( 'name', $row_data['site'] );
        if( is_null( $db_site ) )
        {
          $result_data['invalid'][] = sprintf(
            'Line %d: site name "%s" doesn\'t exist',
            $rindex + 1,
            $row_data['site']
          );
          continue;
        }
        $site_id = $db_site->id;
      }

      // see if the loan data has changed
      $db_participant = NULL;
      if( !is_null( $row_data['uid'] ) )
      {
        $db_participant = $participant_class_name::get_unique_record( 'uid', $row_data['uid'] );
        if( is_null( $db_participant ) )
        {
          $result_data['invalid'][] = sprintf(
            'Line %d: invalid UID "%s"',
            $rindex + 1,
            $row_data['uid']
          );
          continue;
        }
      }

      if( is_null( $db_equipment ) )
      {
        // restrict new equipment to the serial number regex (if there is on)
        if( !is_null( $this->regex ) )
        {
          if( 0 == preg_match( sprintf( '/%s/', $this->regex ), $row_data['serial_number'] ) )
          {
            $result_data['invalid'][] = sprintf(
              'Line %d: serial number "%s" does not match the correct format',
              $rindex + 1,
              $row_data['serial_number']
            );
            continue;
          }
        }

        $db_equipment = lib::create( 'database\equipment' );
        $db_equipment->equipment_type_id = $this->id;
        $db_equipment->serial_number = $row_data['serial_number'];
        $result_data['equipment']['new']++;
        $unchanged = false;
      }
      else if( $this->id != $db_equipment->equipment_type_id )
      {
        $result_data['invalid'][] = sprintf(
          'Line %d: serial number "%s" already exists and belongs to another equipment type (%s)',
          $rindex + 1,
          $row_data['serial_number'],
          $db_equipment->get_equipment_type()->name
        );
        continue;
      }
      else if(
        $site_id != $db_equipment->site_id ||
        $row_data['active'] != $db_equipment->active ||
        $row_data['note'] != $db_equipment->note
      ) {
        $result_data['equipment']['update']++;
        $unchanged = false;
      }

      $db_equipment->site_id = $site_id;
      $db_equipment->active = $row_data['active'];
      $db_equipment->note = $row_data['note'];
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
        else if( $row_data['uid'] != $db_equipment_loan->get_participant()->uid )
        {
          // a loan exists but it doesn't match the UID, so close it (if open) and create a new loan
          if( is_null( $db_equipment_loan->end_datetime ) ) $edit_existing_loan = true;
          $create_new_loan = true;
        }
        else // a loan exists and it matches the UID
        {
          // Update the loan if the start, end or note isn't the same as the data
          if(
            $row_data['start_datetime'] != $db_equipment_loan->start_datetime ||
            $row_data['end_datetime'] != $db_equipment_loan->end_datetime ||
            $row_data['loan_note'] != $db_equipment_loan->note
          ) {
            $edit_existing_loan = true;
          }
        }

        if( $edit_existing_loan )
        {
          if( $apply )
          {
            $db_equipment_loan->lost = $row_data['lost'];
            $db_equipment_loan->start_datetime = $row_data['start_datetime'];
            $db_equipment_loan->end_datetime = $row_data['end_datetime'];
            $db_equipment_loan->note = $row_data['loan_note'];
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
            $db_equipment_loan->lost = $row_data['lost'];
            $db_equipment_loan->start_datetime = $row_data['start_datetime'];
            $db_equipment_loan->end_datetime = $row_data['end_datetime'];
            $db_equipment_loan->note = $row_data['loan_note'];
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

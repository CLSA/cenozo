<?php
/**
 * availability.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * availability: record
 */
class availability extends record {}

// define the join to the participant_site table
$participant_site_mod = lib::create( 'database\modifier' );
$participant_site_mod->where(
  'availability.participant_id', '=', 'participant_site.participant_id', false );
availability::customize_join( 'participant_site', $participant_site_mod );

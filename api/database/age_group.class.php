<?php
/**
 * age_group.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * age_group: record
 */
class age_group extends record {}

// define the lower as the primary unique key
age_group::set_primary_unique_key( 'uq_lower' );

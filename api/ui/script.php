<?php
$lists = array(
  array( 'sref' => 'Activity', 'title' => 'Activities' ),
  array( 'sref' => 'Assignment', 'title' => 'Assignments' ),
  array( 'sref' => 'CedarInstance', 'title' => 'Cedar Instances' ),
  array( 'sref' => 'Collection', 'title' => 'Collections' ),
  array( 'sref' => 'Interview', 'title' => 'Interviews' ),
  array( 'sref' => 'Language', 'title' => 'Languages' ),
  array( 'sref' => 'OpalInstance', 'title' => 'Opal Instances' ),
  array( 'sref' => 'Participant', 'title' => 'Participants' ),
  array( 'sref' => 'Qnaire', 'title' => 'Questionnaires' ),
  array( 'sref' => 'Queue', 'title' => 'Queues' ),
  array( 'sref' => 'Quota', 'title' => 'Quotas' ),
  array( 'sref' => 'RegionSite', 'title' => 'Region Sites' ),
  array( 'sref' => 'Setting', 'title' => 'Settings' ),
  array( 'sref' => 'Site', 'title' => 'Sites' ),
  array( 'sref' => 'State', 'title' => 'States' ),
  array( 'sref' => 'SystemMessage', 'title' => 'System Messages' ),
  array( 'sref' => 'User', 'title' => 'Users' ) );

$utilities = array(
  array( 'sref' => 'ParticipantMultiedit', 'title' => 'Participant Multiedit' ),
  array( 'sref' => 'ParticipantMultinote', 'title' => 'Participant Note' ),
  array( 'sref' => 'ParticipantReassign', 'title' => 'Participant Reassign' ),
  array( 'sref' => 'ParticipantSearch', 'title' => 'Participant Search' ),
  array( 'sref' => 'ParticipantTree', 'title' => 'Participant Tree' ) );

$reports = array(
  array( 'sref' => 'CallHistory', 'title' => 'Call History' ),
  array( 'sref' => 'ConsentRequired', 'title' => 'Consent Required' ),
  array( 'sref' => 'Email', 'title' => 'Email' ),
  array( 'sref' => 'MailoutRequired', 'title' => 'Mailout Required' ),
  array( 'sref' => 'Participant', 'title' => 'Participant' ),
  array( 'sref' => 'ParticipantStatus', 'title' => 'Participant Status' ),
  array( 'sref' => 'ParticipantTree', 'title' => 'Participant Tree' ),
  array( 'sref' => 'Productivity', 'title' => 'Productivity' ),
  array( 'sref' => 'Sample', 'title' => 'Sample' ),
  array( 'sref' => 'Timing', 'title' => 'Timing' ) );
?>
'use strict';

var cenozoApp = angular.module( 'cenozoApp' );

cenozoApp.config( [
  '$stateProvider',
  function( $stateProvider ) {
    var moduleList = [
<?php foreach( $lists as $i ) printf( "'%s',\n", $i['sref'] ); ?>
    ];

    for( var i = 0; i < moduleList.length; i++ ) cnRouteModule( $stateProvider, moduleList[i] );
  }
] );

cenozoApp.controller( 'CnMenuCtrl', [
  '$scope', '$state', '$location',
  function( $scope, $state, $location ) {
    $scope.isCurrentState = function isCurrentState( state ) { return $state.is( state ); };

    $scope.lists = [
<?php foreach( $lists as $i ) printf( "{ sref: '%s', title: '%s' },\n", $i['sref'], $i['title'] ); ?>
    ];

    $scope.utilities = [
<?php foreach( $utilities as $i ) printf( "{ sref: '%s', title: '%s' },\n", $i['sref'], $i['title'] ); ?>
    ];

    $scope.reports = [
<?php foreach( $reports as $i ) printf( "{ sref: '%s', title: '%s' },\n", $i['sref'], $i['title'] ); ?>
    ];
  }
] );

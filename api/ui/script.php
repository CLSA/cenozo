<?php
$utility_module_list = array(
  array( 'sref' => 'ParticipantMultiedit', 'title' => 'Participant Multiedit' ),
  array( 'sref' => 'ParticipantMultinote', 'title' => 'Participant Note' ),
  array( 'sref' => 'ParticipantReassign', 'title' => 'Participant Reassign' ),
  array( 'sref' => 'ParticipantSearch', 'title' => 'Participant Search' ),
  array( 'sref' => 'ParticipantTree', 'title' => 'Participant Tree' ) );

$report_module_list = array(
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
<?php
foreach( $list_module_list as $subject => $list_module )
  printf( "{ name: '%s', actions: ['%s'] },\n", $subject, join( "','", $list_module['actions'] ) );
?>
    ];
    for( var i = 0; i < moduleList.length; i++ ) cnRouteModule( $stateProvider, moduleList[i] );
  }
] );

cenozoApp.controller( 'CnMenuCtrl', [
  '$scope', '$state', '$location',
  function( $scope, $state, $location ) {
    $scope.isCurrentState = function isCurrentState( state ) { return $state.is( state ); };

    $scope.lists = [
<?php
  foreach( $list_module_list as $subject => $list_module )
    printf( "{ sref: '%s.list', title: '%s' },\n", $subject, $list_module['title'] );
?>
    ];

    $scope.utilities = [
<?php foreach( $utility_module_list as $i ) printf( "{ sref: '%s', title: '%s' },\n", $i['sref'], $i['title'] ); ?>
    ];

    $scope.reports = [
<?php foreach( $report_module_list as $i ) printf( "{ sref: '%s', title: '%s' },\n", $i['sref'], $i['title'] ); ?>
    ];
  }
] );

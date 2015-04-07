<?php
$lists = array(
  array( 'sref' => 'activity',
         'title' => 'Activities',
         'actions' => array( 'list' ) ),
  array( 'sref' => 'assignment',
         'title' => 'Assignments',
         'actions' => array( 'list' ) ),
  array( 'sref' => 'cedar_instance',
         'title' => 'Cedar Instances',
         'actions' => array( 'list' ) ),
  array( 'sref' => 'collection',
         'title' => 'Collections',
         'actions' => array( 'add', 'list', 'view' ) ),
  array( 'sref' => 'interview',
         'title' => 'Interviews',
         'actions' => array( 'list' ) ),
  array( 'sref' => 'language',
         'title' => 'Languages',
         'actions' => array( 'list', 'view' ) ),
  array( 'sref' => 'opal_instance',
         'title' => 'Opal Instances',
         'actions' => array( 'list' ) ),
  array( 'sref' => 'participant',
         'title' => 'Participants',
         'actions' => array( 'list', 'view' ) ),
  array( 'sref' => 'qnaire',
         'title' => 'Questionnaires',
         'actions' => array( 'list' ) ),
  array( 'sref' => 'queue',
         'title' => 'Queues',
         'actions' => array( 'list' ) ),
  array( 'sref' => 'quota',
         'title' => 'Quotas',
         'actions' => array( 'add', 'list', 'view' ) ),
  array( 'sref' => 'region_site',
         'title' => 'Region Sites',
         'actions' => array( 'add', 'list', 'view' ) ),
  array( 'sref' => 'setting',
         'title' => 'Settings',
         'actions' => array( 'list', 'view' ) ),
  array( 'sref' => 'site',
         'title' => 'Sites',
         'actions' => array( 'add', 'list', 'view' ) ),
  array( 'sref' => 'state',
         'title' => 'States',
         'actions' => array( 'add', 'list', 'view' ) ),
  array( 'sref' => 'system_message',
         'title' => 'System Messages',
         'actions' => array( 'add', 'list', 'view' ) ),
  array( 'sref' => 'user',
         'title' => 'Users',
         'actions' => array( 'add', 'list', 'view' ) ) );

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
<?php foreach( $lists as $i ) printf( "{ name: '%s', actions: ['%s'] },\n", $i['sref'], join( "','", $i['actions'] ) ); ?>
    ];
    for( var i = 0; i < moduleList.length; i++ ) cnRouteModule( $stateProvider, moduleList[i] );
  }
] );

cenozoApp.controller( 'CnMenuCtrl', [
  '$scope', '$state', '$location',
  function( $scope, $state, $location ) {
    $scope.isCurrentState = function isCurrentState( state ) { return $state.is( state ); };

    $scope.lists = [
<?php foreach( $lists as $i ) printf( "{ sref: '%s.list', title: '%s' },\n", $i['sref'], $i['title'] ); ?>
    ];

    $scope.utilities = [
<?php foreach( $utilities as $i ) printf( "{ sref: '%s', title: '%s' },\n", $i['sref'], $i['title'] ); ?>
    ];

    $scope.reports = [
<?php foreach( $reports as $i ) printf( "{ sref: '%s', title: '%s' },\n", $i['sref'], $i['title'] ); ?>
    ];
  }
] );

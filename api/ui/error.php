<!doctype html>
<html lang="en" ng-app="sabretoothApp">
<head>
  <meta charset="utf-8">
  <title><?php echo ucwords( INSTANCE ); ?></title>
  <link rel="shortcut icon" href="img/favicon.ico" />
  <link rel="stylesheet" href="<?php print LIB_URL; ?>/bootstrap/dist/css/bootstrap.css">
  <link rel="stylesheet" href="<?php echo CSS_URL; ?>/app.css" />
</head>

<body>
  <div class="container-fluid bg-warning">
    <h2><?php echo $title; ?></h2>
    <pre><?php echo $message; ?></pre>
    <h2><kbd>Error code: I.<?php echo $code; ?></kbd></h2>
  </div>
</body>

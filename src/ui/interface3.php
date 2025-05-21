<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <script>
    const CENOZO_URL = "<?php print CENOZO3_URL; ?>";
    const ROOT_URL = "<?php print ROOT_URL; ?>";
    const APP_TITLE = "<?php print APP_TITLE; ?>";
  </script>

<?php $this->print_libs(); ?>

  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="-1">
  <title><?php echo APP_TITLE; ?></title>
</head>
<body class="background user-select-none"></body>
</html>

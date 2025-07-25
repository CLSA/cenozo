<!doctype html>
<html lang="en" data-bs-theme="custom">
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
<body>
  <div name="app_bg" class="bg-loading">
    <div name="app_body" class="user-select-none">
      <nav class="navbar navbar-expand-lg navbar-dark bg-primary p-0">
        <div class="container-fluid">
          <button type="button" class="btn btn-outline-light my-1" disabled="">
            <strong><?php echo APP_TITLE; ?></strong>
          </button>
          <div class="collapse navbar-collapse ms-2">
            <div>
              <i class="bi-chevron-compact-right text-light"></i>
              <button class="home btn btn-primary px-1" disabled="true">Loading...</button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  </div>
</body>
</html>

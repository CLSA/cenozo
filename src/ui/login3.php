<!doctype html>
<html lang="en" data-bs-theme="custom">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <script>
    const CENOZO_URL = "<?php print CENOZO3_URL; ?>";
    const ROOT_URL = "<?php print ROOT_URL; ?>";
    const APP_TITLE = "<?php print APP_TITLE; ?>";
    const FIREFOX_MIN_VER = <?php echo $firefox_minimum_version; ?>;
    const CHROME_MIN_VER = <?php echo $chrome_minimum_version; ?>;
  </script>

<?php $this->print_libs(); ?>

  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="-1">

  <title><?php echo APP_TITLE; ?></title>
</head>
<body class="background user-select-none">
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary p-0">
    <div class="container-fluid">
      <button type="button" class="btn btn-outline-light my-1" disabled>
        <strong><?php echo APP_TITLE; ?></strong>
      </button>
      <div class="collapse navbar-collapse ms-2">
        <div>
          <i class="bi-chevron-compact-right text-light"></i>
          <button class="home btn btn-primary px-1" disabled="true">Home</button>
        </div>
      </div>
    </div>
  </nav>

  <div id="main-content" class="bg-white pt-2 pb-4">
    <div class="container my-3">
      <img id="logo" class="img-responsive w-50" onerror="this.style.display='none'"></img>
    </div>

    <div class="container">
      <div class="card">
        <form name="login">
          <div class="card-header text-bg-primary fw-bold fs-4">
            Login Required
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div>
                <label for="username" class="form-label">Email address</label>
                <input type="username" class="form-control" id="username" placeholder="Username" required>
              </div>
              <div>
                <label for="password" class="form-label">Password</label>
                <input type="password" class="form-control" id="password" placeholder="Password" required>
              </div>
            </div>
          </div>
          <div class="card-footer text-bg-info p-3">
            <button name="submit" type="button" class="btn btn-lg btn-primary" autofocus>Submit</button>
            <span name="login-message" class="text-danger mx-3"></span>
          </div>
        </form>
      </div>
    </div>
  </div>
</body>
</html>

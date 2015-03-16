<div class="span-drawers">
  <div class="snap-drawer snap-drawer-left" ng-controller="StMenuCtrl">
    <accordion close-others="true">
      <accordion-group ng-init="isOpen = true" is-open="isOpen">
        <accordion-heading>
          <button class="btn btn-primary btn-accordion full-width">Lists</button>
        </accordion-heading>
        <div class="btn-group-vertical full-width" role="group">
          <a class="btn btn-default"
             ng-repeat="item in lists"
             ng-class="{ 'btn-info': isCurrentState( item.sref ) }"
             ui-sref="{{ item.sref }}"
             snap-close>{{ item.title }}</a>
        </div>
      </accordion-group>
      <accordion-group>
        <accordion-heading>
          <button class="btn btn-primary btn-accordion full-width">Utilities</button>
        </accordion-heading>
        <div class="btn-group-vertical full-width" role="group">
          <a class="btn btn-default"
             ng-repeat="item in utilities"
             ng-class="{ 'btn-info': isCurrentState( item.sref ) }"
             ui-sref="{{ item.sref }}"
             snap-close>{{ item.title }}</a>
        </div>
      </accordion-group>
      <accordion-group>
        <accordion-heading>
          <button class="btn btn-primary btn-accordion full-width">Report</button>
        </accordion-heading>
        <div class="btn-group-vertical full-width" role="group">
          <a class="btn btn-default"
             ng-repeat="item in reports"
             ng-class="{ 'btn-info': isCurrentState( item.sref ) }"
             ui-sref="{{ item.sref }}"
             snap-close>{{ item.title }}</a>
        </div>
      </accordion-group>
    </accordion>
  </div>
</div>

<snap-content snap-opt-tap-to-close="true" snap-opt-min-drag-distance="10000">
  <button snap-toggle="left" class="btn btn-primary menu-button rounded-top">Menu</button>
  <div class="container-fluid bg-info top-heading">
    <div class="row">
      <div class="col-xs-3 site-title">
        <?php printf( '%s version %s', ucwords( APPLICATION ), $version ); ?>
      </div>
      <div class="col-xs-6">
      </div>
      <div class="col-xs-3">
        <div class="btn-group full-width">
        <div class="btn-group half-width" dropdown>
          <button type="button" class="btn btn-info dropdown-toggle full-width" dropdown-toggle>
            Site 1 <i class="caret"></i>
          </button>
          <ul class="dropdown-menu" role="menu">
            <li><a href="#">Site 2</a></li>
            <li><a href="#">Site 3</a></li>
            <li><a href="#">Site 4</a></li>
            <li><a href="#">Site 5</a></li>
          </ul>
        </div>
        <div class="btn-group half-width" dropdown>
          <button type="button" class="btn btn-info dropdown-toggle full-width" dropdown-toggle>
            Role 1 <i class="caret"></i>
          </button>
          <ul class="dropdown-menu" role="menu">
            <li><a href="#">Role 2</a></li>
            <li><a href="#">Role 3</a></li>
            <li><a href="#">Role 4</a></li>
            <li><a href="#">Role 5</a></li>
          </ul>
        </div>
        </div>
      </div>
    </div>
  </div>
  <div class="container outer-container" data-snap-ignore="true">
    <div ui-view class="container view-frame"></div>
  </div>
</snap-content>
